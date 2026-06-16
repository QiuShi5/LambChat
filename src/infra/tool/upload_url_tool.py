"""
URL 文件上传到沙箱工具

下载指定 URL 的文件内容，上传到沙箱文件系统的指定路径。
仅在沙箱模式下加载。

通过 ToolRuntime 注入 backend，复用 backend_utils 获取沙箱后端。
"""

import json
import mimetypes
import os
import shlex
from tempfile import SpooledTemporaryFile
from typing import Annotated, Any
from urllib.parse import unquote, urlsplit

import httpx
from langchain.tools import ToolRuntime, tool
from langchain_core.tools import BaseTool, InjectedToolArg

from src.infra.async_utils import run_blocking_io
from src.infra.logging import get_logger
from src.infra.storage.s3.service import get_or_init_storage
from src.infra.tool.backend_utils import get_backend_from_runtime, get_base_url_from_runtime

logger = get_logger(__name__)

# 下载超时（秒）
_DOWNLOAD_TIMEOUT = 60

# 最大文件大小（50MB，与 S3_INTERNAL_UPLOAD_MAX_SIZE 保持一致）
_MAX_FILE_SIZE = 50 * 1024 * 1024

# Keep small downloads in memory, spill larger ones to disk while enforcing _MAX_FILE_SIZE.
_SPOOL_MAX_MEMORY_BYTES = 2 * 1024 * 1024

# Legacy fallback backends only accept bytes via aupload_files(); keep that path small.
_FALLBACK_UPLOAD_MAX_BYTES = 2 * 1024 * 1024

_UPLOAD_FILE_PREFIX = "/api/upload/file/"


async def _json_dumps_result(data: dict[str, Any]) -> str:
    return await run_blocking_io(json.dumps, data, ensure_ascii=False)


def _destination_path_error(file_path: str) -> str | None:
    if not file_path.startswith("/"):
        return "file_path must be an absolute path"
    if ".." in file_path.replace("\\", "/").split("/"):
        return "path traversal is not allowed"
    normalized = os.path.normpath(file_path)
    if ".." in normalized.split(os.sep):
        return "path traversal is not allowed"
    return None


def _upload_key_error(key: str) -> str | None:
    if not key:
        return "upload file key is empty"
    normalized = key.replace("\\", "/")
    if normalized.startswith("/"):
        return "upload file key must be relative"
    if ".." in normalized.split("/"):
        return "upload file key traversal is not allowed"
    return None


def _upload_key_from_url(url: str, *, base_url: str = "") -> tuple[str | None, str | None]:
    del base_url
    parsed = urlsplit(url)
    path = unquote(parsed.path or "")

    if not path.startswith(_UPLOAD_FILE_PREFIX):
        return None, None

    key = path[len(_UPLOAD_FILE_PREFIX) :]
    if key_error := _upload_key_error(key):
        return None, key_error
    return key, None


def _upload_key_from_reference(reference: str) -> tuple[str | None, str | None]:
    key, key_error = _upload_key_from_url(reference)
    if key or key_error:
        return key, key_error
    if urlsplit(reference).scheme or urlsplit(reference).netloc:
        return None, "upload_file must be a LambChat upload key or /api/upload/file URL"
    if key_error := _upload_key_error(reference):
        return None, key_error
    return reference, None


async def _download_internal_upload_file(key: str) -> tuple[bytes, str]:
    storage = await get_or_init_storage()
    content = await storage.download_file(key)
    content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
    return content, content_type


async def _upload_backend_file(backend: Any, file_path: str, content: bytes):
    if hasattr(backend, "aupload_files"):
        return await backend.aupload_files([(file_path, content)])
    if hasattr(backend, "upload_files"):
        return await run_blocking_io(backend.upload_files, [(file_path, content)])
    raise RuntimeError("backend does not support upload_files")


def _sandbox_download_command(url: str, file_path: str) -> str:
    script = f"""
import os
import urllib.request

url = {url!r}
file_path = {file_path!r}
max_size = {_MAX_FILE_SIZE!r}
chunk_size = 1024 * 1024

parent = os.path.dirname(file_path)
if parent:
    os.makedirs(parent, exist_ok=True)

tmp_path = file_path + ".download_tmp"
total = 0
try:
    with urllib.request.urlopen(url, timeout={_DOWNLOAD_TIMEOUT!r}) as response:
        with open(tmp_path, "wb") as out:
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_size:
                    raise RuntimeError(f"File too large: {{total}} bytes (max {{max_size}})")
                out.write(chunk)
    os.replace(tmp_path, file_path)
    print(total)
except Exception:
    try:
        os.remove(tmp_path)
    except FileNotFoundError:
        pass
    raise
"""
    return f"python3 -c {shlex.quote(script)}"


async def _execute_sandbox_download(backend, url: str, file_path: str) -> tuple[bool, str]:
    command = _sandbox_download_command(url, file_path)
    if hasattr(backend, "aexecute"):
        result = await backend.aexecute(command)
    elif hasattr(backend, "execute"):
        result = await run_blocking_io(backend.execute, command)
    else:
        return False, "backend does not support execute"

    exit_code = getattr(result, "exit_code", 0)
    output = getattr(result, "output", "")
    if exit_code == 0:
        return True, str(output or "")
    return False, str(output or f"exit_code={exit_code}")


@tool
async def upload_url_to_sandbox(
    url: Annotated[str, "要下载的文件 URL"],
    file_path: Annotated[str, "沙箱内的目标文件路径（绝对路径）"],
    runtime: Annotated[ToolRuntime, InjectedToolArg],
) -> str:
    """Download a file from a URL and upload it to the sandbox filesystem.

    Use this tool to transfer external files (user uploads, web resources) into the sandbox
    so they can be accessed by shell commands and scripts.
    """
    if path_error := _destination_path_error(file_path):
        return await _json_dumps_result({"success": False, "error": path_error})

    # 获取 backend
    backend = get_backend_from_runtime(runtime)
    if backend is None:
        return await _json_dumps_result({"success": False, "error": "No sandbox backend available"})

    # 如果 url 是相对路径，拼接 base_url
    if url.startswith("/"):
        base_url = get_base_url_from_runtime(runtime)
        if base_url:
            url = f"{base_url}{url}"
        else:
            logger.warning("[upload_url_to_sandbox] url is relative but base_url is empty: %s", url)

    if hasattr(backend, "aexecute") or hasattr(backend, "execute"):
        try:
            ok, output = await _execute_sandbox_download(backend, url, file_path)
            if ok:
                logger.info(
                    "[upload_url_to_sandbox] Sandbox downloaded %s -> %s (%s)",
                    url,
                    file_path,
                    output.strip(),
                )
                return await _json_dumps_result(
                    {"success": True, "path": file_path, "source": "sandbox"}
                )
            logger.warning("[upload_url_to_sandbox] Sandbox download failed: %s", output)
        except Exception as e:
            logger.warning("[upload_url_to_sandbox] Sandbox download failed: %s", e)

    # 下载文件
    content: bytes
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=_DOWNLOAD_TIMEOUT) as client:
            with SpooledTemporaryFile(max_size=_SPOOL_MAX_MEMORY_BYTES, mode="w+b") as spooled:
                total_size = 0
                async with client.stream("GET", url) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_bytes():
                        if not chunk:
                            continue
                        total_size += len(chunk)
                        if total_size > _MAX_FILE_SIZE:
                            return await _json_dumps_result(
                                {
                                    "success": False,
                                    "error": (
                                        f"File too large: {total_size} bytes (max {_MAX_FILE_SIZE})"
                                    ),
                                }
                            )
                        if total_size > _FALLBACK_UPLOAD_MAX_BYTES:
                            return await _json_dumps_result(
                                {
                                    "success": False,
                                    "error": (
                                        "File too large for API-side fallback upload; "
                                        "use a backend with sandbox-side download support"
                                    ),
                                }
                            )
                        await run_blocking_io(spooled.write, chunk)
                await run_blocking_io(spooled.seek, 0)
                content = await run_blocking_io(spooled.read)
    except httpx.HTTPStatusError as e:
        logger.warning(f"[upload_url_to_sandbox] HTTP error downloading {url}: {e}")
        return await _json_dumps_result(
            {
                "success": False,
                "error": f"Download failed: HTTP {e.response.status_code}",
            }
        )
    except Exception as e:
        logger.warning(f"[upload_url_to_sandbox] Failed to download {url}: {e}")
        return await _json_dumps_result({"success": False, "error": f"Download failed: {e}"})

    # 上传到沙箱
    try:
        results = await _upload_backend_file(backend, file_path, content)
        result = results[0]
        if result.error:
            return await _json_dumps_result(
                {
                    "success": False,
                    "error": f"Upload failed: {result.error}",
                    "path": file_path,
                }
            )
        logger.info(f"[upload_url_to_sandbox] Uploaded {url} -> {file_path} ({len(content)} bytes)")
        return await _json_dumps_result({"success": True, "path": file_path, "size": len(content)})
    except Exception as e:
        logger.error(f"[upload_url_to_sandbox] Failed to upload to {file_path}: {e}")
        return await _json_dumps_result({"success": False, "error": f"Upload failed: {e}"})


@tool
async def copy_upload_file_to_workspace(
    upload_file: Annotated[
        str,
        "LambChat upload storage key or /api/upload/file proxy URL to copy",
    ],
    file_path: Annotated[str, "Absolute destination path in the current workspace"],
    runtime: Annotated[ToolRuntime, InjectedToolArg],
) -> str:
    """Copy a LambChat upload-storage object into the active workspace/backend.

    Use this after tools such as image_generate return an upload key or /api/upload/file URL
    that must become a real file inside a package directory, for example
    /workspace/scene_01/first_frame.png. This tool reads LambChat upload storage directly;
    it does not fetch arbitrary external URLs.
    """
    if path_error := _destination_path_error(file_path):
        return await _json_dumps_result({"success": False, "error": path_error})

    backend = get_backend_from_runtime(runtime)
    if backend is None:
        return await _json_dumps_result({"success": False, "error": "No backend available"})

    upload_key, upload_key_error = _upload_key_from_reference(upload_file)
    if upload_key_error:
        return await _json_dumps_result({"success": False, "error": upload_key_error})

    try:
        content, content_type = await _download_internal_upload_file(upload_key or "")
        if len(content) > _MAX_FILE_SIZE:
            return await _json_dumps_result(
                {
                    "success": False,
                    "error": f"File too large: {len(content)} bytes (max {_MAX_FILE_SIZE})",
                }
            )

        results = await _upload_backend_file(backend, file_path, content)
        result = results[0]
        if result.error:
            return await _json_dumps_result(
                {
                    "success": False,
                    "error": f"Upload failed: {result.error}",
                    "path": file_path,
                }
            )
        logger.info(
            "[copy_upload_file_to_workspace] Copied upload storage key %s -> %s (%s bytes)",
            upload_key,
            file_path,
            len(content),
        )
        return await _json_dumps_result(
            {
                "success": True,
                "path": file_path,
                "size": len(content),
                "content_type": content_type,
                "source": "upload_storage",
                "key": upload_key,
            }
        )
    except Exception as e:
        logger.warning(
            "[copy_upload_file_to_workspace] Failed to copy upload storage key %s: %s",
            upload_key,
            e,
        )
        return await _json_dumps_result(
            {
                "success": False,
                "error": f"Upload storage copy failed: {e}",
                "source": "upload_storage",
                "key": upload_key,
            }
        )


def get_upload_url_tool() -> BaseTool:
    """获取 upload_url_to_sandbox 工具实例"""
    return upload_url_to_sandbox


def get_copy_upload_file_to_workspace_tool() -> BaseTool:
    """Return the upload-storage-to-workspace copy tool."""
    return copy_upload_file_to_workspace

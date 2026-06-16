"""Archive creation tools for backend workspace files."""

from __future__ import annotations

import inspect
import json
import os
import zipfile
from tempfile import SpooledTemporaryFile
from typing import Annotated, Any

from langchain.tools import ToolRuntime, tool
from langchain_core.tools import BaseTool, InjectedToolArg

from src.infra.async_utils import run_blocking_io
from src.infra.logging import get_logger
from src.infra.tool.backend_utils import get_backend_from_runtime

logger = get_logger(__name__)

_MAX_ARCHIVE_FILES = 500
_MAX_SOURCE_BYTES = 100 * 1024 * 1024
_MAX_ZIP_BYTES = 100 * 1024 * 1024
_SPOOL_MAX_MEMORY_BYTES = 8 * 1024 * 1024


async def _json_dumps_result(data: dict[str, Any]) -> str:
    return await run_blocking_io(json.dumps, data, ensure_ascii=False)


def _path_error(path: str) -> str | None:
    if not path.startswith("/"):
        return "path must be absolute"
    if ".." in path.replace("\\", "/").split("/"):
        return "path traversal is not allowed"
    normalized = os.path.normpath(path)
    if ".." in normalized.split(os.sep):
        return "path traversal is not allowed"
    return None


def _entry_path(entry: Any) -> str | None:
    if isinstance(entry, dict):
        path = entry.get("path")
    else:
        path = getattr(entry, "path", None)
    return path if isinstance(path, str) else None


def _entry_is_dir(entry: Any) -> bool:
    if isinstance(entry, dict):
        return bool(entry.get("is_dir"))
    return bool(getattr(entry, "is_dir", False))


async def _list_files_via_glob(backend: Any, source_dir: str) -> list[str]:
    pattern = "**/*"
    if hasattr(backend, "aglob"):
        try:
            result = backend.aglob(pattern, path=source_dir)
            if inspect.isawaitable(result):
                result = await result
            return [
                path
                for entry in (getattr(result, "matches", None) or [])
                if (path := _entry_path(entry))
            ]
        except Exception as e:
            logger.debug("[create_zip_from_path] aglob failed for %s: %s", source_dir, e)
    if hasattr(backend, "glob"):
        try:
            result = await run_blocking_io(backend.glob, pattern, source_dir)
            return [
                path
                for entry in (getattr(result, "matches", None) or [])
                if (path := _entry_path(entry))
            ]
        except Exception as e:
            logger.debug("[create_zip_from_path] glob failed for %s: %s", source_dir, e)
    return []


async def _list_files_via_ls(backend: Any, source_dir: str) -> list[str]:
    files: list[str] = []
    pending = [source_dir.rstrip("/")]
    visited: set[str] = set()

    while pending and len(files) <= _MAX_ARCHIVE_FILES:
        current = pending.pop()
        if current in visited:
            continue
        visited.add(current)
        try:
            if hasattr(backend, "als"):
                result = backend.als(current)
                if inspect.isawaitable(result):
                    result = await result
            elif hasattr(backend, "ls"):
                result = await run_blocking_io(backend.ls, current)
            else:
                break
        except Exception as e:
            logger.debug("[create_zip_from_path] ls failed for %s: %s", current, e)
            continue

        for entry in getattr(result, "entries", None) or []:
            path = _entry_path(entry)
            if not path:
                continue
            if _entry_is_dir(entry):
                pending.append(path.rstrip("/"))
            else:
                files.append(path)
                if len(files) > _MAX_ARCHIVE_FILES:
                    break
    return files


async def _list_source_files(backend: Any, source_dir: str) -> list[str]:
    files = await _list_files_via_glob(backend, source_dir)
    if not files:
        files = await _list_files_via_ls(backend, source_dir)
    return sorted(dict.fromkeys(files))


async def _download_file(backend: Any, file_path: str) -> bytes | None:
    if hasattr(backend, "adownload_files"):
        try:
            responses = backend.adownload_files([file_path])
            if inspect.isawaitable(responses):
                responses = await responses
            if responses and responses[0].content is not None:
                return responses[0].content
        except Exception as e:
            logger.debug("[create_zip_from_path] adownload_files failed for %s: %s", file_path, e)
    if hasattr(backend, "download_files"):
        try:
            responses = await run_blocking_io(backend.download_files, [file_path])
            if responses and responses[0].content is not None:
                return responses[0].content
        except Exception as e:
            logger.debug("[create_zip_from_path] download_files failed for %s: %s", file_path, e)
    return None


async def _upload_file(backend: Any, file_path: str, content: bytes) -> str | None:
    if hasattr(backend, "aupload_files"):
        responses = backend.aupload_files([(file_path, content)])
        if inspect.isawaitable(responses):
            responses = await responses
    elif hasattr(backend, "upload_files"):
        responses = await run_blocking_io(backend.upload_files, [(file_path, content)])
    else:
        return "backend does not support upload_files"
    if responses and getattr(responses[0], "error", None):
        return str(responses[0].error)
    return None


def _zip_member_name(source_dir: str, file_path: str) -> str:
    source = source_dir.rstrip("/") + "/"
    if file_path.startswith(source):
        rel = file_path[len(source) :]
    else:
        rel = file_path.rsplit("/", 1)[-1]
    rel = rel.replace("\\", "/").lstrip("/")
    normalized = os.path.normpath(rel).replace("\\", "/")
    if normalized == "." or normalized.startswith("../") or normalized == "..":
        raise ValueError(f"Unsafe archive member path: {rel}")
    return normalized


@tool
async def create_zip_from_path(
    source_dir: Annotated[str, "Absolute source directory path in the current workspace"],
    zip_path: Annotated[str, "Absolute destination .zip file path in the current workspace"],
    runtime: Annotated[ToolRuntime, InjectedToolArg],
) -> str:
    """Create a real zip archive from a workspace/backend directory."""
    for label, path in (("source_dir", source_dir), ("zip_path", zip_path)):
        if err := _path_error(path):
            return await _json_dumps_result({"success": False, "error": f"{label}: {err}"})

    backend = get_backend_from_runtime(runtime)
    if backend is None:
        return await _json_dumps_result({"success": False, "error": "No backend available"})

    files = [path for path in await _list_source_files(backend, source_dir) if path != zip_path]
    if len(files) > _MAX_ARCHIVE_FILES:
        return await _json_dumps_result(
            {
                "success": False,
                "error": f"too many files: {len(files)} (max {_MAX_ARCHIVE_FILES})",
            }
        )
    if not files:
        return await _json_dumps_result(
            {"success": False, "error": f"no files found in {source_dir}"}
        )

    skipped: list[str] = []
    total_source_size = 0
    with SpooledTemporaryFile(max_size=_SPOOL_MAX_MEMORY_BYTES, mode="w+b") as spooled:
        with zipfile.ZipFile(spooled, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
            for file_path in files:
                content = await _download_file(backend, file_path)
                if content is None:
                    skipped.append(file_path)
                    continue
                total_source_size += len(content)
                if total_source_size > _MAX_SOURCE_BYTES:
                    return await _json_dumps_result(
                        {
                            "success": False,
                            "error": (
                                f"source files too large: {total_source_size} "
                                f"bytes (max {_MAX_SOURCE_BYTES})"
                            ),
                        }
                    )
                archive.writestr(_zip_member_name(source_dir, file_path), content)
        await run_blocking_io(spooled.seek, 0, os.SEEK_END)
        zip_size = await run_blocking_io(spooled.tell)
        if zip_size > _MAX_ZIP_BYTES:
            return await _json_dumps_result(
                {
                    "success": False,
                    "error": f"zip file too large: {zip_size} bytes (max {_MAX_ZIP_BYTES})",
                }
            )
        await run_blocking_io(spooled.seek, 0)
        zip_content = await run_blocking_io(spooled.read)

    upload_error = await _upload_file(backend, zip_path, zip_content)
    if upload_error:
        return await _json_dumps_result(
            {"success": False, "error": f"Upload failed: {upload_error}", "path": zip_path}
        )

    return await _json_dumps_result(
        {
            "success": True,
            "path": zip_path,
            "file_count": len(files) - len(skipped),
            "skipped": skipped,
            "source_size": total_source_size,
            "zip_size": len(zip_content),
        }
    )


def get_archive_tools() -> list[BaseTool]:
    """Return archive-related tools."""
    return [create_zip_from_path]

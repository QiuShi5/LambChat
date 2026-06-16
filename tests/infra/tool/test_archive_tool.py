from __future__ import annotations

import io
import json
import zipfile
from types import SimpleNamespace

import pytest

from src.infra.tool import archive_tool, upload_url_tool


class _Runtime:
    def __init__(self, backend: object) -> None:
        self.config = {"configurable": {"backend": backend}}


class _FakeBackend:
    def __init__(self, files: dict[str, bytes]) -> None:
        self.files = dict(files)

    async def aglob(self, pattern: str, path: str):
        assert pattern == "**/*"
        prefix = path.rstrip("/") + "/"
        return SimpleNamespace(
            matches=[
                {"path": file_path} for file_path in self.files if file_path.startswith(prefix)
            ]
        )

    async def adownload_files(self, paths: list[str]):
        return [
            SimpleNamespace(path=path, content=self.files.get(path), error=None) for path in paths
        ]

    async def aupload_files(self, files: list[tuple[str, bytes]]):
        for path, content in files:
            self.files[path] = content
        return [SimpleNamespace(path=path, error=None) for path, _content in files]


@pytest.mark.asyncio
async def test_create_zip_from_path_packages_real_png_files() -> None:
    png = b"\x89PNG\r\n\x1a\nimage-bytes"
    backend = _FakeBackend(
        {
            "/workspace/pkg/01_scene/image_1.png": png,
            "/workspace/pkg/01_scene/image_2.png": png,
            "/workspace/pkg/01_scene/image_3.png": png,
            "/workspace/pkg/01_scene/image_4.png": png,
            "/workspace/pkg/01_scene/video_plan_and_prompts.md": b"# prompts\n",
        }
    )

    result = json.loads(
        await archive_tool.create_zip_from_path.coroutine(
            source_dir="/workspace/pkg",
            zip_path="/workspace/pkg.zip",
            runtime=_Runtime(backend),
        )
    )

    assert result["success"] is True
    assert result["path"] == "/workspace/pkg.zip"
    assert result["file_count"] == 5
    assert result["skipped"] == []

    with zipfile.ZipFile(io.BytesIO(backend.files["/workspace/pkg.zip"])) as archive:
        names = set(archive.namelist())
        assert {
            "01_scene/image_1.png",
            "01_scene/image_2.png",
            "01_scene/image_3.png",
            "01_scene/image_4.png",
            "01_scene/video_plan_and_prompts.md",
        } <= names
        for index in range(1, 5):
            assert archive.read(f"01_scene/image_{index}.png").startswith(b"\x89PNG\r\n\x1a\n")


@pytest.mark.asyncio
async def test_create_zip_from_path_rejects_relative_paths() -> None:
    result = json.loads(
        await archive_tool.create_zip_from_path.coroutine(
            source_dir="workspace/pkg",
            zip_path="/workspace/pkg.zip",
            runtime=_Runtime(_FakeBackend({})),
        )
    )

    assert result["success"] is False
    assert "source_dir" in result["error"]


@pytest.mark.asyncio
async def test_create_zip_from_path_rejects_path_traversal() -> None:
    result = json.loads(
        await archive_tool.create_zip_from_path.coroutine(
            source_dir="/workspace/pkg/../other",
            zip_path="/workspace/pkg.zip",
            runtime=_Runtime(_FakeBackend({})),
        )
    )

    assert result["success"] is False
    assert "path traversal" in result["error"]


@pytest.mark.asyncio
async def test_copy_images_then_create_zip_package(monkeypatch: pytest.MonkeyPatch) -> None:
    png = b"\x89PNG\r\n\x1a\nimage-bytes"
    backend = _FakeBackend(
        {
            "/workspace/pkg/01_scene/video_plan_and_prompts.md": b"# prompts\n",
        }
    )

    class _FakeStorage:
        async def download_file(self, key: str) -> bytes:
            assert key.startswith("generated-")
            return png

    class _FailHttpClient:
        async def __aenter__(self):
            raise AssertionError("upload proxy URLs should use storage directly")

    async def fake_get_or_init_storage():
        return _FakeStorage()

    monkeypatch.setattr(upload_url_tool, "get_or_init_storage", fake_get_or_init_storage)
    monkeypatch.setattr(
        upload_url_tool.httpx,
        "AsyncClient",
        lambda **_kwargs: _FailHttpClient(),
    )

    class _UrlRuntime(_Runtime):
        def __init__(self, backend: object) -> None:
            self.config = {
                "configurable": {"backend": backend, "base_url": "https://app.example.com"}
            }

    for index in range(1, 5):
        result = json.loads(
            await upload_url_tool.copy_upload_file_to_workspace.coroutine(
                upload_file=f"/api/upload/file/generated-{index}.png",
                file_path=f"/workspace/pkg/01_scene/image_{index}.png",
                runtime=_UrlRuntime(backend),
            )
        )
        assert result["success"] is True

    zip_result = json.loads(
        await archive_tool.create_zip_from_path.coroutine(
            source_dir="/workspace/pkg",
            zip_path="/workspace/pkg.zip",
            runtime=_Runtime(backend),
        )
    )

    assert zip_result["success"] is True
    with zipfile.ZipFile(io.BytesIO(backend.files["/workspace/pkg.zip"])) as archive:
        for index in range(1, 5):
            assert archive.read(f"01_scene/image_{index}.png") == png

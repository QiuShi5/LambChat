from __future__ import annotations

from types import SimpleNamespace

import pytest

from src.infra.distributed_validation import (
    DistributedRuntimeConfigError,
    is_distributed_runtime,
    validate_distributed_runtime_settings,
)


def _settings(**overrides):
    values = {
        "JWT_SECRET_KEY": "stable-jwt-secret-that-is-long-enough",
        "MCP_ENCRYPTION_SALT": "stable-mcp-salt",
        "S3_ENABLED": True,
        "S3_PROVIDER": "custom",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_local_runtime_allows_generated_secrets_and_local_storage() -> None:
    settings = _settings(S3_ENABLED=False)
    settings._jwt_secret_key_generated = True
    settings._mcp_encryption_salt_generated = True

    validate_distributed_runtime_settings(settings, distributed_mode=False)


def test_distributed_runtime_rejects_generated_jwt_secret() -> None:
    settings = _settings()
    settings._jwt_secret_key_generated = True
    settings._mcp_encryption_salt_generated = False

    with pytest.raises(DistributedRuntimeConfigError, match="JWT_SECRET_KEY"):
        validate_distributed_runtime_settings(settings, distributed_mode=True)


def test_distributed_runtime_rejects_generated_mcp_salt() -> None:
    settings = _settings()
    settings._jwt_secret_key_generated = False
    settings._mcp_encryption_salt_generated = True

    with pytest.raises(DistributedRuntimeConfigError, match="MCP_ENCRYPTION_SALT"):
        validate_distributed_runtime_settings(settings, distributed_mode=True)


def test_distributed_runtime_rejects_local_upload_storage() -> None:
    settings = _settings(S3_ENABLED=False)
    settings._jwt_secret_key_generated = False
    settings._mcp_encryption_salt_generated = False

    with pytest.raises(DistributedRuntimeConfigError, match="S3_ENABLED"):
        validate_distributed_runtime_settings(settings, distributed_mode=True)


def test_distributed_runtime_accepts_stable_shared_configuration() -> None:
    settings = _settings()
    settings._jwt_secret_key_generated = False
    settings._mcp_encryption_salt_generated = False

    validate_distributed_runtime_settings(settings, distributed_mode=True)


def test_is_distributed_runtime_reads_boolean_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LAMBCHAT_DISTRIBUTED_MODE", "true")
    assert is_distributed_runtime() is True

    monkeypatch.setenv("LAMBCHAT_DISTRIBUTED_MODE", "0")
    assert is_distributed_runtime() is False


def test_is_distributed_runtime_detects_replica_count(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LAMBCHAT_DISTRIBUTED_MODE", raising=False)
    monkeypatch.setenv("LAMBCHAT_REPLICA_COUNT", "2")

    assert is_distributed_runtime() is True

"""Startup validation for distributed runtime safety."""

from __future__ import annotations

import os
from typing import Any

from src.infra.local_filesystem import should_prepare_local_filesystem


class DistributedRuntimeConfigError(RuntimeError):
    """Raised when settings are unsafe for multi-replica deployments."""


def _parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return None


def is_distributed_runtime(environ: dict[str, str] | None = None) -> bool:
    """Return whether this process should enforce multi-replica safety checks."""
    env = environ if environ is not None else os.environ
    explicit = _parse_bool(env.get("LAMBCHAT_DISTRIBUTED_MODE"))
    if explicit is not None:
        return explicit

    replica_count = env.get("LAMBCHAT_REPLICA_COUNT")
    if replica_count:
        try:
            return int(replica_count) > 1
        except ValueError:
            return False

    return False


def _was_generated(settings: Any, attr_name: str) -> bool:
    return bool(getattr(settings, attr_name, False))


def validate_distributed_runtime_settings(
    settings: Any,
    *,
    distributed_mode: bool | None = None,
) -> None:
    """Fail fast when process-local defaults would break distributed deployments."""
    enabled = is_distributed_runtime() if distributed_mode is None else distributed_mode
    if not enabled:
        return

    errors: list[str] = []
    if _was_generated(settings, "_jwt_secret_key_generated"):
        errors.append("JWT_SECRET_KEY must be explicitly set and identical across replicas")
    if _was_generated(settings, "_mcp_encryption_salt_generated"):
        errors.append("MCP_ENCRYPTION_SALT must be explicitly set and identical across replicas")
    if should_prepare_local_filesystem(settings):
        errors.append("S3_ENABLED=true with shared object storage is required for uploads")

    if errors:
        raise DistributedRuntimeConfigError("; ".join(errors))

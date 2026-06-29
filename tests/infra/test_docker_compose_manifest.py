from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]


def _load_compose() -> dict:
    return yaml.safe_load((ROOT / "deploy/docker-compose.yml").read_text(encoding="utf-8"))


def _env_map(service: dict) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in service.get("environment", []):
        if not isinstance(item, str) or "=" not in item:
            continue
        key, value = item.split("=", 1)
        result[key] = value
    return result


def test_docker_compose_enables_redis_backed_embedded_arq_worker() -> None:
    compose = _load_compose()
    lambchat = compose["services"]["lambchat"]
    env = _env_map(lambchat)

    assert env["REDIS_URL"] == "redis://redis:6379/0"
    assert env["TASK_BACKEND"] == "arq"
    assert env["ARQ_EMBEDDED_WORKER"] == "true"
    assert env["ARQ_QUEUE_NAME"] == "lambchat:arq"


def test_docker_compose_persists_plugin_data_for_workflow_runtime() -> None:
    compose = _load_compose()
    lambchat = compose["services"]["lambchat"]

    assert "plugin-data:/app/plugin-data" in lambchat["volumes"]
    assert "plugin-data" in compose["volumes"]


def test_dockerfile_bundles_system_plugins_for_container_runtime() -> None:
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")

    assert "COPY plugins/ ./plugins/" in dockerfile


def test_python_wheel_bundles_plugin_backend_namespace() -> None:
    pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")

    assert '"src/plugins"' in pyproject


def test_dockerfile_bundles_dify_workflow_container_acceptance_assets() -> None:
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")

    assert (
        "COPY scripts/dify_workflow_container_acceptance.py "
        "./scripts/dify_workflow_container_acceptance.py"
    ) in dockerfile
    assert "COPY tests/fixtures/dify_workflow/ ./tests/fixtures/dify_workflow/" in dockerfile


def test_dockerignore_keeps_only_dify_workflow_acceptance_assets() -> None:
    dockerignore = (ROOT / ".dockerignore").read_text(encoding="utf-8")

    assert "tests/*" in dockerignore
    assert "!tests/fixtures/dify_workflow/**" in dockerignore
    assert "scripts/*" in dockerignore
    assert "!scripts/dify_workflow_container_acceptance.py" in dockerignore


def test_makefile_exposes_dify_workflow_container_acceptance_target() -> None:
    makefile = (ROOT / "Makefile").read_text(encoding="utf-8")

    assert "docker-dify-workflow-acceptance" in makefile
    assert "python scripts/dify_workflow_container_acceptance.py" in makefile

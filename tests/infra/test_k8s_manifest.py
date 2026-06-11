from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]


def _load_k8s_docs() -> list[dict]:
    return [
        doc
        for doc in yaml.safe_load_all((ROOT / "k8s/lambchat.yaml").read_text())
        if isinstance(doc, dict)
    ]


def _env_map(container: dict) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in container.get("env", []):
        if "name" in item and "value" in item:
            result[item["name"]] = item["value"]
    return result


def test_k8s_api_deployment_enables_distributed_embedded_arq_worker() -> None:
    deployment = next(
        doc
        for doc in _load_k8s_docs()
        if doc.get("kind") == "Deployment" and doc["metadata"]["name"] == "lambchat"
    )
    container = deployment["spec"]["template"]["spec"]["containers"][0]
    env = _env_map(container)

    assert env["LAMBCHAT_DISTRIBUTED_MODE"] == "true"
    assert env["TASK_BACKEND"] == "arq"
    assert env["ARQ_EMBEDDED_WORKER"] == "true"


def test_k8s_manifest_uses_symmetric_app_nodes_without_required_worker_deployment() -> None:
    deployment_names = {
        doc["metadata"]["name"] for doc in _load_k8s_docs() if doc.get("kind") == "Deployment"
    }

    assert "lambchat" in deployment_names
    assert "lambchat-worker" not in deployment_names

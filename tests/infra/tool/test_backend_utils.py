from types import SimpleNamespace

from src.infra.tool.backend_utils import get_backend_from_runtime


def test_get_backend_from_runtime_prefers_delivery_backend() -> None:
    persistent_backend = object()
    delivery_backend = object()
    runtime = SimpleNamespace(
        config={
            "configurable": {
                "backend": persistent_backend,
                "delivery_backend": delivery_backend,
            }
        }
    )

    assert get_backend_from_runtime(runtime) is delivery_backend


def test_get_backend_from_runtime_falls_back_to_backend() -> None:
    persistent_backend = object()
    runtime = SimpleNamespace(config={"configurable": {"backend": persistent_backend}})

    assert get_backend_from_runtime(runtime) is persistent_backend

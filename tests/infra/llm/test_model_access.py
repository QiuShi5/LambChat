from __future__ import annotations

import pytest

from src.infra.llm.client import LLMClient
from src.kernel.exceptions import AuthorizationError
from src.kernel.schemas.model import ModelConfig


class _ModelStorage:
    def __init__(self, model: ModelConfig | None) -> None:
        self.model = model

    async def get(self, model_id: str) -> ModelConfig | None:
        return self.model if self.model and self.model.id == model_id else None


@pytest.mark.asyncio
async def test_get_model_rejects_disabled_model_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    disabled_model = ModelConfig(
        id="disabled-model",
        value="openai/gpt-disabled",
        label="Disabled",
        enabled=False,
    )
    storage = _ModelStorage(disabled_model)

    monkeypatch.setattr(
        "src.infra.agent.model_storage.get_model_storage",
        lambda: storage,
    )

    with pytest.raises(AuthorizationError, match="model_disabled"):
        await LLMClient.get_model(model_id="disabled-model")


@pytest.mark.asyncio
async def test_get_model_rejects_unknown_model_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    storage = _ModelStorage(None)

    monkeypatch.setattr(
        "src.infra.agent.model_storage.get_model_storage",
        lambda: storage,
    )

    with pytest.raises(AuthorizationError, match="model_not_found"):
        await LLMClient.get_model(model_id="missing-model")

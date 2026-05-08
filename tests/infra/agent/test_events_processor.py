from types import SimpleNamespace
from typing import Any

import pytest

from src.infra.agent import AgentEventProcessor
from src.infra.agent.events.buffers import TextChunkBuffer
from src.infra.agent.events.tool_outputs import detect_tool_error


class FakePresenter:
    def __init__(self) -> None:
        self.emitted: list[dict[str, Any]] = []

    async def emit(self, event: dict[str, Any]) -> None:
        self.emitted.append(event)

    def present_text(
        self,
        content: str,
        text_id: str | None = None,
        depth: int = 0,
        agent_id: str | None = None,
    ) -> dict[str, Any]:
        return {
            "event": "message:chunk",
            "data": {
                "content": content,
                "text_id": text_id,
                "depth": depth,
                "agent_id": agent_id,
            },
        }

    def present_summary(
        self,
        content: str,
        summary_id: str | None = None,
        depth: int = 0,
        agent_id: str | None = None,
    ) -> dict[str, Any]:
        return {
            "event": "summary",
            "data": {
                "content": content,
                "summary_id": summary_id,
                "depth": depth,
                "agent_id": agent_id,
            },
        }

    def present_thinking(
        self,
        content: str,
        thinking_id: str | None = None,
        depth: int = 0,
        agent_id: str | None = None,
    ) -> dict[str, Any]:
        return {
            "event": "thinking",
            "data": {
                "content": content,
                "thinking_id": thinking_id,
                "depth": depth,
                "agent_id": agent_id,
            },
        }

    def present_agent_call(
        self,
        agent_id: str,
        agent_name: str,
        input_message: str,
        depth: int = 1,
    ) -> dict[str, Any]:
        return {
            "event": "agent:call",
            "data": {
                "agent_id": agent_id,
                "agent_name": agent_name,
                "input": input_message,
                "depth": depth,
            },
        }

    def present_agent_result(
        self,
        agent_id: str,
        result: str,
        success: bool = True,
        depth: int = 1,
        error: str | None = None,
    ) -> dict[str, Any]:
        return {
            "event": "agent:result",
            "data": {
                "agent_id": agent_id,
                "result": result,
                "success": success,
                "depth": depth,
                "error": error,
            },
        }


def chat_stream(content: str, chunk_id: str = "chunk-1", metadata: dict[str, Any] | None = None):
    return {
        "event": "on_chat_model_stream",
        "name": "chat_model",
        "data": {"chunk": SimpleNamespace(content=content, id=chunk_id)},
        "metadata": metadata or {},
    }


@pytest.mark.asyncio
async def test_finalize_flushes_pending_summary_chunk() -> None:
    presenter = FakePresenter()
    processor = AgentEventProcessor(presenter)

    await processor.process_event(
        chat_stream("summarized intent", "summary-1", {"lc_source": "summarization"})
    )

    assert presenter.emitted == []

    await processor.finalize()

    assert presenter.emitted == [
        {
            "event": "summary",
            "data": {
                "content": "summarized intent",
                "summary_id": "summary-1",
                "depth": 0,
                "agent_id": None,
            },
        }
    ]


@pytest.mark.asyncio
async def test_text_chunk_key_change_flushes_previous_chunk_without_dropping_current() -> None:
    presenter = FakePresenter()
    processor = AgentEventProcessor(presenter)

    await processor.process_event(chat_stream("hello", "chunk-1"))
    await processor.process_event(chat_stream("world", "chunk-2"))
    await processor.process_event({"event": "on_chat_model_end", "data": {"output": None}})

    assert [event["data"]["content"] for event in presenter.emitted] == ["hello", "world"]


@pytest.mark.asyncio
async def test_reasoning_content_chunk_emits_thinking_event() -> None:
    presenter = FakePresenter()
    processor = AgentEventProcessor(presenter)

    await processor.process_event(
        {
            "event": "on_chat_model_stream",
            "name": "chat_model",
            "data": {
                "chunk": SimpleNamespace(
                    content="",
                    id="chunk-r",
                    additional_kwargs={"reasoning_content": "step by step"},
                )
            },
            "metadata": {},
        }
    )

    assert presenter.emitted == [
        {
            "event": "thinking",
            "data": {
                "content": "step by step",
                "thinking_id": "chunk-r",
                "depth": 0,
                "agent_id": None,
            },
        }
    ]


@pytest.mark.asyncio
async def test_subagent_context_cache_is_invalidated_by_task_lifecycle() -> None:
    presenter = FakePresenter()
    processor = AgentEventProcessor(presenter)
    processor.checkpoint_to_agent["parent"] = ("agent-1", "worker")

    assert processor._get_agent_context("parent|child") == ("agent-1", 1)
    assert processor._agent_context_cache["parent|child"] == ("agent-1", 1)

    await processor.process_event(
        {
            "event": "on_tool_start",
            "name": "task",
            "run_id": "task-run",
            "data": {"input": {"subagent_type": "worker", "description": "do work"}},
            "metadata": {"checkpoint_ns": "parent"},
        }
    )

    assert processor._agent_context_cache == {}


def test_text_chunk_buffer_consume_ready_flushes_previous_key_without_losing_current() -> None:
    buffer = TextChunkBuffer(flush_size=10)

    assert buffer.append("hello", (0, None, "chunk-1")) is False
    assert buffer.consume_ready((0, None, "chunk-2")) == ("hello", (0, None, "chunk-1"))
    assert buffer.append("world", (0, None, "chunk-2")) is False
    assert buffer.consume() == ("world", (0, None, "chunk-2"))


def test_detect_tool_error_detects_string_error_prefix() -> None:
    assert detect_tool_error(None, "Error: failed to run") == (True, "Error: failed to run")

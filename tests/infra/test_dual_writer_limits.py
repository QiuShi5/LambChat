from __future__ import annotations

import pytest

from src.infra.session import dual_writer


def test_dual_writer_limits_follow_runtime_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        dual_writer.settings,
        "SESSION_EVENT_MONGO_BUFFER_MAX",
        123,
        raising=False,
    )
    monkeypatch.setattr(
        dual_writer.settings,
        "SESSION_EVENT_TTL_CACHE_MAX",
        456,
        raising=False,
    )

    assert dual_writer._get_mongo_buffer_max() == 123
    assert dual_writer._get_ttl_set_keys_max() == 456


class _FakeRedis:
    def __init__(self) -> None:
        self.xadd_calls: list[tuple[str, dict]] = []
        self.ttl_calls: list[str] = []
        self.expire_calls: list[tuple[str, int]] = []

    async def xadd(self, stream_key: str, fields: dict) -> None:
        self.xadd_calls.append((stream_key, fields))

    async def ttl(self, stream_key: str) -> int:
        self.ttl_calls.append(stream_key)
        return -1

    async def expire(self, stream_key: str, ttl: int) -> None:
        self.expire_calls.append((stream_key, ttl))


@pytest.mark.asyncio
async def test_dual_writer_refreshes_ttl_for_long_running_streams(monkeypatch) -> None:
    fake_redis = _FakeRedis()
    writer = dual_writer.DualEventWriter()
    writer._redis = fake_redis

    now = 1000.0
    monkeypatch.setattr(dual_writer.time, "monotonic", lambda: now)
    monkeypatch.setattr(dual_writer.settings, "SSE_CACHE_TTL", 3600, raising=False)

    await writer._write_to_redis_direct("session:s1:run:r1:events", {"event_type": "chunk"})
    await writer._write_to_redis_direct("session:s1:run:r1:events", {"event_type": "chunk"})

    assert fake_redis.expire_calls == [("session:s1:run:r1:events", 3600)]

    now += 301
    await writer._write_to_redis_direct("session:s1:run:r1:events", {"event_type": "chunk"})

    assert fake_redis.expire_calls == [
        ("session:s1:run:r1:events", 3600),
        ("session:s1:run:r1:events", 3600),
    ]

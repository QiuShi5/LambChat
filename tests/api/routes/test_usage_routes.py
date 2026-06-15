from datetime import datetime, timezone

import pytest

from src.api.routes import usage as usage_routes
from src.kernel.schemas.user import TokenPayload


class _FakeUsageStorage:
    def __init__(self):
        self.calls = []

    async def list_usage_logs(self, **kwargs):
        self.calls.append(kwargs)
        return (
            [
                {
                    "trace_id": "trace-1",
                    "session_id": "session-1",
                    "user_id": kwargs.get("user_id") or "user-2",
                    "username": "Ada",
                    "model": "openai/gpt-5",
                    "input_tokens": 10,
                    "output_tokens": 5,
                    "total_tokens": 15,
                    "cache_creation_tokens": 2,
                    "cache_read_tokens": 3,
                    "duration": 1.5,
                    "started_at": datetime(2026, 6, 14, tzinfo=timezone.utc),
                    "completed_at": None,
                    "status": "completed",
                }
            ],
            1,
            {
                "total_requests": 1,
                "total_input_tokens": 10,
                "total_output_tokens": 5,
                "total_tokens": 15,
                "total_cache_creation_tokens": 2,
                "total_cache_read_tokens": 3,
                "total_duration": 1.5,
            },
        )


@pytest.mark.asyncio
async def test_list_usage_logs_restricts_non_admin_to_current_user(monkeypatch) -> None:
    storage = _FakeUsageStorage()
    monkeypatch.setattr(usage_routes, "get_usage_storage", lambda: storage)
    user = TokenPayload(
        sub="user-1",
        username="User",
        permissions=["usage:read"],
    )

    response = await usage_routes.list_usage_logs(
        skip=0,
        limit=50,
        user_id="user-2",
        search="Ada",
        model="openai/gpt-5",
        start_date=None,
        end_date=None,
        user=user,
    )

    assert response.total == 1
    assert storage.calls == [
        {
            "user_id": "user-1",
            "model": "openai/gpt-5",
            "start_date": None,
            "end_date": None,
            "search": None,
            "skip": 0,
            "limit": 50,
        }
    ]


@pytest.mark.asyncio
async def test_list_usage_logs_allows_admin_global_search(monkeypatch) -> None:
    storage = _FakeUsageStorage()
    monkeypatch.setattr(usage_routes, "get_usage_storage", lambda: storage)
    user = TokenPayload(
        sub="admin-1",
        username="Admin",
        permissions=["usage:read", "usage:admin"],
    )

    await usage_routes.list_usage_logs(
        skip=5,
        limit=25,
        user_id=None,
        search="Ada",
        model=None,
        start_date=None,
        end_date=None,
        user=user,
    )

    assert storage.calls[0]["user_id"] is None
    assert storage.calls[0]["search"] == "Ada"
    assert storage.calls[0]["skip"] == 5
    assert storage.calls[0]["limit"] == 25


@pytest.mark.asyncio
async def test_get_usage_stats_uses_period_and_admin_scope(monkeypatch) -> None:
    storage = _FakeUsageStorage()
    monkeypatch.setattr(usage_routes, "get_usage_storage", lambda: storage)
    monkeypatch.setattr(
        usage_routes,
        "_now_utc",
        lambda: datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc),
    )
    user = TokenPayload(
        sub="admin-1",
        username="Admin",
        permissions=["usage:read", "usage:admin"],
    )

    response = await usage_routes.get_usage_stats(
        user_id="user-2",
        period="today",
        user=user,
    )

    assert response.total_tokens == 15
    assert storage.calls[0]["user_id"] == "user-2"
    assert storage.calls[0]["start_date"] == "2026-06-14T00:00:00+00:00"
    assert storage.calls[0]["skip"] == 0
    assert storage.calls[0]["limit"] == 1

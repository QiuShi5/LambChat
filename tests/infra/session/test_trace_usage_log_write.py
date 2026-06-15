import pytest

from src.infra.session import trace_storage as trace_storage_module


class _FakeTraceCollection:
    async def find_one(self, query):
        assert query == {"trace_id": "trace-1"}
        return {"trace_id": "trace-1", "events": []}


class _FakeDatabase(dict):
    def __getitem__(self, name):
        assert name == trace_storage_module.settings.MONGODB_TRACES_COLLECTION
        return _FakeTraceCollection()


class _FakeUsageCollection:
    database = _FakeDatabase()


class _FakeUsageStorage:
    def __init__(self):
        self.collection = _FakeUsageCollection()
        self.upsert_calls = []

    async def upsert_usage_log(self, trace_doc):
        self.upsert_calls.append(trace_doc)
        return True


@pytest.mark.asyncio
async def test_write_usage_log_reads_trace_and_upserts(monkeypatch) -> None:
    storage = _FakeUsageStorage()
    monkeypatch.setattr(
        "src.infra.usage.storage.get_usage_storage",
        lambda: storage,
    )

    await trace_storage_module._write_usage_log("trace-1")

    assert storage.upsert_calls == [{"trace_id": "trace-1", "events": []}]

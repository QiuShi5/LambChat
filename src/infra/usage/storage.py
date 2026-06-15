"""
Usage storage layer.

独立的 usage_logs 集合，在 trace 完成时写入扁平化的 token 消耗记录。
查询时直接从该集合读取，避免对 traces 集合做复杂聚合。
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from src.infra.logging import get_logger
from src.infra.storage.mongodb import get_mongo_client
from src.infra.utils.datetime import parse_iso
from src.kernel.config import settings

logger = get_logger(__name__)

USAGE_LOG_LIMIT_MAX = 200


def _as_int(value: Any) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return max(value, 0)
    if isinstance(value, float):
        return max(int(value), 0)
    if isinstance(value, str):
        try:
            return max(int(float(value)), 0)
        except ValueError:
            return 0
    return 0


def _as_float(value: Any) -> float:
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return max(float(value), 0.0)
    if isinstance(value, str):
        try:
            return max(float(value), 0.0)
        except ValueError:
            return 0.0
    return 0.0


def _as_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return parse_iso(value)
        except ValueError:
            return None
    return None


class UsageStorage:
    """使用日志存储 — 独立的 usage_logs 集合"""

    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        """延迟加载 usage_logs 集合"""
        if self._collection is None:
            client = get_mongo_client()
            db = client[settings.MONGODB_DB]
            self._collection = db[settings.MONGODB_USAGE_LOGS_COLLECTION]
        return self._collection

    async def ensure_indexes(self) -> None:
        """创建索引"""
        try:
            await self.collection.create_index(
                "trace_id",
                unique=True,
                name="trace_id_unique_idx",
            )
            await self.collection.create_index([("user_id", 1), ("started_at", -1)])
            await self.collection.create_index([("started_at", -1)])
            await self.collection.create_index([("model", 1), ("started_at", -1)])
            logger.info("Usage logs indexes ensured")
        except Exception as e:
            logger.error(f"Failed to create usage logs indexes: {e}")

    async def upsert_usage_log(self, trace_doc: Dict[str, Any]) -> bool:
        """
        从 trace 文档提取 token:usage 数据，写入 usage_logs 集合。

        在 trace 完成时调用，将扁平化的使用记录存入独立集合。

        Args:
            trace_doc: trace 完整文档（包含 events 数组和 metadata）

        Returns:
            是否写入成功
        """
        trace_id = trace_doc.get("trace_id")
        if not trace_id:
            return False

        # 从 events 中找到最后一个 token:usage 事件
        usage_event = None
        for event in reversed(trace_doc.get("events", [])):
            if event.get("event_type") == "token:usage":
                usage_event = event.get("data", {})
                break

        metadata = trace_doc.get("metadata", {}) or {}
        usage_data = usage_event or {}
        input_tokens = _as_int(usage_data.get("input_tokens", 0))
        output_tokens = _as_int(usage_data.get("output_tokens", 0))
        total_tokens = _as_int(usage_data.get("total_tokens", 0))
        if total_tokens <= 0:
            total_tokens = input_tokens + output_tokens

        doc = {
            "trace_id": trace_id,
            "session_id": trace_doc.get("session_id", ""),
            "run_id": trace_doc.get("run_id", ""),
            "user_id": trace_doc.get("user_id", ""),
            "username": metadata.get("username", ""),
            "agent_id": trace_doc.get("agent_id", ""),
            "agent_name": metadata.get("agent_name", ""),
            "model": usage_data.get("model", ""),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "cache_creation_tokens": _as_int(usage_data.get("cache_creation_tokens", 0)),
            "cache_read_tokens": _as_int(usage_data.get("cache_read_tokens", 0)),
            "duration": _as_float(usage_data.get("duration", 0.0)),
            "started_at": _as_datetime(trace_doc.get("started_at")),
            "completed_at": _as_datetime(trace_doc.get("completed_at")),
            "status": trace_doc.get("status", "unknown"),
            "step_count": _as_int(metadata.get("step_count", 0)),
            "tool_calls": _as_int(metadata.get("tool_calls", 0)),
        }

        try:
            await self.collection.update_one(
                {"trace_id": trace_id},
                {"$set": doc},
                upsert=True,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert usage log for trace {trace_id}: {e}")
            return False

    async def list_usage_logs(
        self,
        *,
        user_id: Optional[str] = None,
        model: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
        """
        查询使用日志列表。

        Args:
            user_id: 按用户过滤
            model: 按模型过滤
            start_date: 开始日期 (ISO string)
            end_date: 结束日期 (ISO string)
            search: 搜索用户名
            skip: 跳过数量
            limit: 返回数量

        Returns:
            (items, total, stats_dict)
        """
        limit = max(1, min(limit, USAGE_LOG_LIMIT_MAX))
        skip = max(0, skip)

        query: Dict[str, Any] = {}

        if user_id:
            query["user_id"] = user_id
        if model:
            query["model"] = model
        if start_date or end_date:
            date_filter: Dict[str, Any] = {}
            if start_date:
                date_filter["$gte"] = parse_iso(start_date)
            if end_date:
                date_filter["$lt"] = parse_iso(end_date)
            query["started_at"] = date_filter
        if search:
            query["username"] = {"$regex": search, "$options": "i"}

        try:
            # 并行执行 count + stats + items
            import asyncio

            count_task = asyncio.create_task(self._count_and_stats(query))
            items_task = asyncio.create_task(self._fetch_items(query, skip, limit))

            total, stats = await count_task
            items = await items_task

            return items, total, stats
        except Exception as e:
            logger.error(f"Failed to list usage logs: {e}")
            return [], 0, _empty_stats()

    async def _count_and_stats(self, query: Dict[str, Any]) -> tuple[int, Dict[str, Any]]:
        """计算总数和聚合统计"""
        total = await self.collection.count_documents(query)

        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": None,
                    "total_input_tokens": {"$sum": "$input_tokens"},
                    "total_output_tokens": {"$sum": "$output_tokens"},
                    "total_tokens": {"$sum": "$total_tokens"},
                    "total_cache_creation_tokens": {"$sum": "$cache_creation_tokens"},
                    "total_cache_read_tokens": {"$sum": "$cache_read_tokens"},
                    "total_duration": {"$sum": "$duration"},
                }
            },
        ]

        stats = _empty_stats()
        stats["total_requests"] = total

        try:
            async for doc in self.collection.aggregate(pipeline):
                stats.update(
                    {
                        "total_input_tokens": doc.get("total_input_tokens", 0),
                        "total_output_tokens": doc.get("total_output_tokens", 0),
                        "total_tokens": doc.get("total_tokens", 0),
                        "total_cache_creation_tokens": doc.get("total_cache_creation_tokens", 0),
                        "total_cache_read_tokens": doc.get("total_cache_read_tokens", 0),
                        "total_duration": doc.get("total_duration", 0.0),
                    }
                )
                break  # only one group result
        except Exception as e:
            logger.error(f"Failed to aggregate usage stats: {e}")

        return total, stats

    async def _fetch_items(
        self, query: Dict[str, Any], skip: int, limit: int
    ) -> List[Dict[str, Any]]:
        """获取分页数据"""
        try:
            cursor = (
                self.collection.find(query, {"_id": 0})
                .sort("started_at", -1)
                .skip(skip)
                .limit(limit)
            )
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Failed to fetch usage items: {e}")
            return []

    async def get_user_usage_summary(self, user_id: str) -> Dict[str, Any]:
        """获取单个用户的用量汇总"""
        query = {"user_id": user_id}
        total = await self.collection.count_documents(query)

        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": None,
                    "total_input_tokens": {"$sum": "$input_tokens"},
                    "total_output_tokens": {"$sum": "$output_tokens"},
                    "total_tokens": {"$sum": "$total_tokens"},
                    "total_duration": {"$sum": "$duration"},
                }
            },
        ]

        summary: Dict[str, Any] = {"total_requests": total}
        try:
            async for doc in self.collection.aggregate(pipeline):
                summary.update(
                    {
                        "total_input_tokens": doc.get("total_input_tokens", 0),
                        "total_output_tokens": doc.get("total_output_tokens", 0),
                        "total_tokens": doc.get("total_tokens", 0),
                        "total_duration": doc.get("total_duration", 0.0),
                    }
                )
                break
        except Exception as e:
            logger.error(f"Failed to get user usage summary: {e}")

        return summary


def _empty_stats() -> Dict[str, Any]:
    return {
        "total_requests": 0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_tokens": 0,
        "total_cache_creation_tokens": 0,
        "total_cache_read_tokens": 0,
        "total_duration": 0.0,
    }


def get_usage_storage() -> UsageStorage:
    """获取 UsageStorage 实例"""
    return UsageStorage()

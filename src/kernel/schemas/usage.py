"""
Usage log schemas for token consumption tracking.

定义使用日志的数据模型，基于 traces 集合中的 token:usage 事件。
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UsageLog(BaseModel):
    """单条使用日志（一次 trace 的 token 消耗）"""

    trace_id: str
    session_id: str
    user_id: str
    username: str = ""
    agent_name: str = ""
    model: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cache_creation_tokens: int = 0
    cache_read_tokens: int = 0
    duration: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "unknown"

    model_config = ConfigDict(from_attributes=True)


class UsageStats(BaseModel):
    """聚合使用统计"""

    total_requests: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    total_cache_creation_tokens: int = 0
    total_cache_read_tokens: int = 0
    total_duration: float = 0.0


class UsageLogListResponse(BaseModel):
    """分页使用日志列表响应"""

    items: list[UsageLog]
    total: int
    stats: UsageStats

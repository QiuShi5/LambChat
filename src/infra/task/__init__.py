# src/infra/task/__init__.py
"""Background Task Manager."""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.infra.task.constants import (
    CANCEL_CHANNEL,
    HEARTBEAT_PREFIX,
    HEARTBEAT_TIMEOUT,
    INTERRUPT_PREFIX,
)
from src.infra.task.exceptions import TaskInterruptedError

if TYPE_CHECKING:
    from src.infra.task.cancellation import TaskCancellation
    from src.infra.task.executor import TaskExecutor
    from src.infra.task.heartbeat import TaskHeartbeat
    from src.infra.task.manager import BackgroundTaskManager
    from src.infra.task.pubsub import TaskPubSub
    from src.infra.task.status import TaskStatus

__all__ = [
    # Main exports (backward compatibility)
    "BackgroundTaskManager",
    "TaskStatus",
    "get_task_manager",
    # Additional exports for advanced usage
    "TaskInterruptedError",
    "TaskCancellation",
    "TaskExecutor",
    "TaskHeartbeat",
    "TaskPubSub",
    "CANCEL_CHANNEL",
    "HEARTBEAT_PREFIX",
    "INTERRUPT_PREFIX",
    "HEARTBEAT_TIMEOUT",
]


def __getattr__(name: str):
    if name == "BackgroundTaskManager" or name == "get_task_manager":
        from src.infra.task.manager import BackgroundTaskManager, get_task_manager

        return BackgroundTaskManager if name == "BackgroundTaskManager" else get_task_manager
    if name == "TaskStatus":
        from src.infra.task.status import TaskStatus

        return TaskStatus
    if name == "TaskCancellation":
        from src.infra.task.cancellation import TaskCancellation

        return TaskCancellation
    if name == "TaskExecutor":
        from src.infra.task.executor import TaskExecutor

        return TaskExecutor
    if name == "TaskHeartbeat":
        from src.infra.task.heartbeat import TaskHeartbeat

        return TaskHeartbeat
    if name == "TaskPubSub":
        from src.infra.task.pubsub import TaskPubSub

        return TaskPubSub
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

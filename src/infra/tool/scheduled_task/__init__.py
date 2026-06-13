"""LLM-callable scheduled task tools.

CRUD tools for creating and managing scheduled tasks.
Each operation is a separate @tool function.

Split from the original monolithic scheduled_task_tool.py.
"""

from langchain_core.tools import BaseTool

from src.infra.tool.scheduled_task.create import scheduled_task_create
from src.infra.tool.scheduled_task.delete import scheduled_task_delete, scheduled_task_run
from src.infra.tool.scheduled_task.read import scheduled_task_get, scheduled_task_list
from src.infra.tool.scheduled_task.update import (
    scheduled_task_pause,
    scheduled_task_resume,
    scheduled_task_update,
)

__all__ = [
    "scheduled_task_create",
    "scheduled_task_list",
    "scheduled_task_get",
    "scheduled_task_update",
    "scheduled_task_pause",
    "scheduled_task_resume",
    "scheduled_task_delete",
    "scheduled_task_run",
    "get_scheduled_task_tools",
]


def get_scheduled_task_tools() -> list[BaseTool]:
    """Return scheduled task CRUD tools for the current user."""
    return [
        scheduled_task_create,
        scheduled_task_list,
        scheduled_task_update,
        scheduled_task_delete,
    ]

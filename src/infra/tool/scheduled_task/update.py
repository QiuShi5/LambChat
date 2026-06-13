"""scheduled_task_update, scheduled_task_pause, scheduled_task_resume tool implementations."""

import sys
from typing import TYPE_CHECKING, Annotated, Any

from langchain_core.tools import InjectedToolArg

from src.infra.scheduler.service import ScheduledTaskService
from src.infra.tool.backend_utils import get_user_id_from_runtime
from src.kernel.schemas.scheduled_task import ScheduledTaskUpdate
from src.kernel.types import Permission

if TYPE_CHECKING:
    from langchain.tools import ToolRuntime
else:
    try:
        from langchain.tools import ToolRuntime  # type: ignore[assignment]
    except ImportError:  # pragma: no cover
        _mod = type(sys)("langchain.tools")  # type: ignore[assignment]
        _mod.ToolRuntime = Any  # type: ignore[assignment]
        sys.modules.setdefault("langchain.tools", _mod)
        from langchain.tools import ToolRuntime  # type: ignore[assignment]

from langchain.tools import tool  # noqa: E402

from src.infra.tool.scheduled_task.helpers import _json, _permission_error


@tool
async def scheduled_task_update(
    task_id: Annotated[str, "ID of the task to update"],
    action: Annotated[
        str | None,
        "Optional operation to perform instead of field updates: 'pause', 'resume', or 'run'.",
    ] = None,
    name: Annotated[str | None, "New task name"] = None,
    message: Annotated[str | None, "New message to send to the agent on each execution"] = None,
    description: Annotated[str | None, "New description"] = None,
    enabled: Annotated[bool | None, "Enable or disable the task"] = None,
    timeout_seconds: Annotated[int | None, "New timeout in seconds (10-3600)"] = None,
    max_retries: Annotated[int | None, "Max retry count on failure (0-10)"] = None,
    trigger_config: Annotated[
        dict | None,
        "Full replacement trigger config. "
        'For interval: {"seconds": 300}. '
        'For cron: {"hour": "9", "minute": "0", "day_of_week": "mon-fri"}. '
        "WARNING: This replaces the entire trigger config. "
        "Use scheduled_task_create to change trigger_type.",
    ] = None,
    runtime: Annotated[ToolRuntime, InjectedToolArg] = None,  # type: ignore[assignment]
) -> str:
    """Update an existing scheduled task. Pass only the fields you want to change.
    Use action='pause', action='resume', or action='run' for lifecycle operations.
    To change the trigger_type, delete the task and create a new one."""
    user_id = get_user_id_from_runtime(runtime)
    if not user_id:
        return _json({"error": "No user context available"})
    error = await _permission_error(user_id, Permission.SCHEDULED_TASK_WRITE.value)
    if error:
        return _json(error)

    # Verify ownership first
    service = ScheduledTaskService()
    task = await service.get_task(task_id)
    if task is None:
        return _json({"error": f"Task '{task_id}' not found"})
    if task.owner_id != user_id:
        return _json({"error": f"Task '{task_id}' not found"})

    if action is not None:
        if action == "pause":
            try:
                updated = await service.pause_task(task_id)
            except Exception as e:
                return _json({"error": f"Failed to pause task: {e}"})
            if updated is None:
                return _json({"error": f"Task '{task_id}' pause failed"})
            return _json(
                {
                    "success": True,
                    "action": "paused",
                    "task_id": task_id,
                    "name": updated.name,
                    "message": f"Task '{updated.name}' paused.",
                }
            )
        if action == "resume":
            try:
                updated = await service.resume_task(task_id)
            except Exception as e:
                return _json({"error": f"Failed to resume task: {e}"})
            if updated is None:
                return _json({"error": f"Task '{task_id}' resume failed"})
            return _json(
                {
                    "success": True,
                    "action": "resumed",
                    "task_id": task_id,
                    "name": updated.name,
                    "message": f"Task '{updated.name}' resumed.",
                }
            )
        if action == "run":
            try:
                result = await service.run_task_now(task_id)
            except Exception as e:
                return _json({"error": f"Failed to run task: {e}"})
            return _json(
                {
                    "success": True,
                    "action": "triggered",
                    "task_id": task_id,
                    "name": task.name,
                    "result": result,
                    "message": f"Task '{task.name}' triggered manually.",
                }
            )
        return _json({"error": "Invalid action. Use 'pause', 'resume', or 'run'."})

    # Build update payload
    updates: dict[str, Any] = {}
    if name is not None:
        updates["name"] = name
    if message is not None:
        updates["input_payload"] = {**(task.input_payload or {}), "message": message}
    if description is not None:
        updates["description"] = description
    if enabled is not None:
        updates["enabled"] = enabled
    if timeout_seconds is not None:
        updates["timeout_seconds"] = timeout_seconds
    if max_retries is not None:
        updates["max_retries"] = max_retries
    if trigger_config is not None:
        updates["trigger_config"] = trigger_config

    if not updates:
        return _json({"error": "At least one field to update is required"})

    try:
        updated = await service.update_task(
            task_id,
            ScheduledTaskUpdate(**updates),
        )
    except Exception as e:
        return _json({"error": f"Failed to update task: {e}"})

    if updated is None:
        return _json({"error": f"Task '{task_id}' update failed"})

    resp = ScheduledTaskService.to_response(updated)
    return _json(
        {
            "success": True,
            "action": "updated",
            "task": resp.model_dump(mode="json"),
            "message": f"Task '{updated.name}' updated.",
        }
    )


@tool
async def scheduled_task_pause(
    task_id: Annotated[str, "ID of the task to pause"],
    runtime: Annotated[ToolRuntime, InjectedToolArg] = None,  # type: ignore[assignment]
) -> str:
    """Pause a scheduled task. The task will not fire until resumed.
    Configuration is preserved and the task can be resumed at any time."""
    user_id = get_user_id_from_runtime(runtime)
    if not user_id:
        return _json({"error": "No user context available"})
    error = await _permission_error(user_id, Permission.SCHEDULED_TASK_WRITE.value)
    if error:
        return _json(error)

    service = ScheduledTaskService()
    task = await service.get_task(task_id)
    if task is None:
        return _json({"error": f"Task '{task_id}' not found"})
    if task.owner_id != user_id:
        return _json({"error": f"Task '{task_id}' not found"})

    try:
        updated = await service.pause_task(task_id)
    except Exception as e:
        return _json({"error": f"Failed to pause task: {e}"})

    if updated is None:
        return _json({"error": f"Task '{task_id}' pause failed"})
    return _json(
        {
            "success": True,
            "action": "paused",
            "task_id": task_id,
            "name": updated.name,
            "message": f"Task '{updated.name}' paused.",
        }
    )


@tool
async def scheduled_task_resume(
    task_id: Annotated[str, "ID of the task to resume"],
    runtime: Annotated[ToolRuntime, InjectedToolArg] = None,  # type: ignore[assignment]
) -> str:
    """Resume a paused scheduled task. It will resume firing according to its schedule."""
    user_id = get_user_id_from_runtime(runtime)
    if not user_id:
        return _json({"error": "No user context available"})
    error = await _permission_error(user_id, Permission.SCHEDULED_TASK_WRITE.value)
    if error:
        return _json(error)

    service = ScheduledTaskService()
    task = await service.get_task(task_id)
    if task is None:
        return _json({"error": f"Task '{task_id}' not found"})
    if task.owner_id != user_id:
        return _json({"error": f"Task '{task_id}' not found"})

    try:
        updated = await service.resume_task(task_id)
    except Exception as e:
        return _json({"error": f"Failed to resume task: {e}"})

    if updated is None:
        return _json({"error": f"Task '{task_id}' resume failed"})
    return _json(
        {
            "success": True,
            "action": "resumed",
            "task_id": task_id,
            "name": updated.name,
            "message": f"Task '{updated.name}' resumed.",
        }
    )

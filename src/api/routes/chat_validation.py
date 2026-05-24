"""Validation helpers for chat routes."""

from fastapi import HTTPException

from src.kernel.schemas.agent import AgentRequest


def validate_team_agent_request(agent_id: str, request: AgentRequest) -> None:
    """Validate team-agent-specific request requirements before dispatch."""
    if agent_id == "team" and not request.team_id:
        raise HTTPException(status_code=400, detail="team_id_required")

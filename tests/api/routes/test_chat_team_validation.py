from __future__ import annotations

import pytest
from fastapi import HTTPException

from src.api.routes.chat_validation import validate_team_agent_request
from src.kernel.schemas.agent import AgentRequest


def test_validate_team_agent_request_requires_team_id() -> None:
    request = AgentRequest(message="hello")

    with pytest.raises(HTTPException) as exc:
        validate_team_agent_request("team", request)

    assert exc.value.status_code == 400
    assert exc.value.detail == "team_id_required"


def test_validate_team_agent_request_allows_team_id() -> None:
    request = AgentRequest(message="hello", team_id="team-1")

    validate_team_agent_request("team", request)


def test_validate_team_agent_request_ignores_other_agents() -> None:
    request = AgentRequest(message="hello")

    validate_team_agent_request("search", request)

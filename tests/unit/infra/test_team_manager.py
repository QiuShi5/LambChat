"""Tests for team manager."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.infra.team.manager import TeamManager
from src.kernel.schemas.team import (
    TeamMemberResponse,
    TeamPreferenceUpdate,
    TeamResponse,
    TeamVisibility,
)


def _make_team(
    *,
    team_id: str = "team-1",
    owner_user_id: str = "user-1",
    name: str = "Test Team",
    members: list[TeamMemberResponse] | None = None,
) -> TeamResponse:
    return TeamResponse(
        id=team_id,
        owner_user_id=owner_user_id,
        name=name,
        members=members or [],
        visibility=TeamVisibility.PRIVATE,
    )


@pytest.fixture
def mock_storage():
    storage = MagicMock()
    return storage


@pytest.fixture
def mock_persona_manager():
    pm = MagicMock()
    pm.storage = MagicMock()
    pm.storage.get_by_id = AsyncMock(return_value=None)
    return pm


@pytest.fixture
def manager(mock_storage, mock_persona_manager):
    return TeamManager(storage=mock_storage, persona_manager=mock_persona_manager)


@pytest.mark.asyncio
async def test_create_team_delegates_to_storage(manager, mock_storage):
    created = _make_team(name="New Team")
    mock_storage.create_team = AsyncMock(return_value=created)

    from src.kernel.schemas.team import TeamCreate

    data = TeamCreate(name="New Team")
    result = await manager.create_team(data, owner_user_id="user-1")

    mock_storage.create_team.assert_awaited_once()
    assert result.name == "New Team"


@pytest.mark.asyncio
async def test_update_team_preference_returns_team_with_user_preference(manager, mock_storage):
    team = _make_team()
    mock_storage.get_team = AsyncMock(return_value=team)
    mock_storage.update_user_preference = AsyncMock(
        return_value={"is_favorite": True, "is_pinned": False, "last_used_at": None}
    )

    result = await manager.update_preference(
        "team-1",
        TeamPreferenceUpdate(is_favorite=True),
        owner_user_id="user-1",
    )

    mock_storage.update_user_preference.assert_awaited_once_with(
        user_id="user-1",
        team_id="team-1",
        update={"is_favorite": True, "is_pinned": None},
    )
    assert result.is_favorite is True
    assert result.is_pinned is False


@pytest.mark.asyncio
async def test_create_team_preserves_member_display_metadata_for_api_response(
    manager, mock_storage
):
    from src.kernel.schemas.team import TeamCreate

    created = _make_team(name="New Team")
    mock_storage.create_team = AsyncMock(return_value=created)

    data = TeamCreate(
        name="New Team",
        members=[
            {
                "member_id": "m-designer",
                "persona_preset_id": "preset-1",
                "role_name": "Designer",
                "role_avatar": "icon:palette",
                "role_tags": ["design"],
            }
        ],
    )

    await manager.create_team(data, owner_user_id="user-1")

    _, kwargs = mock_storage.create_team.await_args
    assert kwargs["members"] == [
        {
            "member_id": "m-designer",
            "persona_preset_id": "preset-1",
            "role_name": "Designer",
            "role_avatar": "icon:palette",
            "role_tags": ["design"],
            "role_instructions": "",
            "position": 0,
            "enabled": True,
        }
    ]


@pytest.mark.asyncio
async def test_create_team_delegates_tags_to_storage(manager, mock_storage):
    from src.kernel.schemas.team import TeamCreate

    created = _make_team(name="Tagged Team")
    mock_storage.create_team = AsyncMock(return_value=created)

    data = TeamCreate(name="Tagged Team", tags=["research", "planning"])
    await manager.create_team(data, owner_user_id="user-1")

    _, kwargs = mock_storage.create_team.await_args
    assert kwargs["tags"] == ["research", "planning"]


@pytest.mark.asyncio
async def test_get_team_raises_not_found(manager, mock_storage):
    mock_storage.get_team = AsyncMock(return_value=None)

    from src.kernel.exceptions import NotFoundError

    with pytest.raises(NotFoundError):
        await manager.get_team("nonexistent", owner_user_id="user-1")


@pytest.mark.asyncio
async def test_validate_team_members_handles_missing_presets(manager, mock_persona_manager):
    members = [
        TeamMemberResponse(
            member_id="m-1",
            persona_preset_id="preset-missing",
            role_name="Agent",
            enabled=True,
        ),
    ]
    team = _make_team(members=members)
    mock_persona_manager.storage.get_by_id = AsyncMock(return_value=None)

    result = await manager.validate_team_members(team)
    assert result == []


@pytest.mark.asyncio
async def test_validate_team_members_with_valid_preset(manager, mock_persona_manager):
    mock_persona_manager.storage.get_by_id = AsyncMock(
        return_value={"name": "Helper", "avatar": "avatar.png", "tags": ["helpful"]}
    )
    members = [
        TeamMemberResponse(
            member_id="m-1",
            persona_preset_id="preset-1",
            enabled=True,
        ),
    ]
    team = _make_team(members=members)

    result = await manager.validate_team_members(team)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_resolve_team_for_runtime_returns_none_when_not_found(manager, mock_storage):
    mock_storage.get_team = AsyncMock(return_value=None)

    result = await manager.resolve_team_for_runtime("missing", owner_user_id="user-1")
    assert result is None


@pytest.mark.asyncio
async def test_resolve_team_for_runtime_returns_none_when_no_active_members(manager, mock_storage):
    team = _make_team(
        members=[
            TeamMemberResponse(
                member_id="m-1",
                persona_preset_id="preset-1",
                enabled=False,
            ),
        ]
    )
    mock_storage.get_team = AsyncMock(return_value=team)

    result = await manager.resolve_team_for_runtime("team-1", owner_user_id="user-1")
    assert result is None


@pytest.mark.asyncio
async def test_resolve_team_for_runtime_returns_team(manager, mock_storage, mock_persona_manager):
    members = [
        TeamMemberResponse(
            member_id="m-1",
            persona_preset_id="preset-1",
            enabled=True,
        ),
    ]
    team = _make_team(members=members)
    mock_storage.get_team = AsyncMock(return_value=team)
    mock_persona_manager.storage.get_by_id = AsyncMock(return_value={"name": "Bot"})

    result = await manager.resolve_team_for_runtime("team-1", owner_user_id="user-1")
    assert result is not None
    assert result.name == "Test Team"


@pytest.mark.asyncio
async def test_resolve_team_for_runtime_returns_none_when_all_active_presets_missing(
    manager, mock_storage, mock_persona_manager
):
    members = [
        TeamMemberResponse(
            member_id="m-1",
            persona_preset_id="missing",
            enabled=True,
        ),
    ]
    team = _make_team(members=members)
    mock_storage.get_team = AsyncMock(return_value=team)
    mock_persona_manager.storage.get_by_id = AsyncMock(return_value=None)

    result = await manager.resolve_team_for_runtime("team-1", owner_user_id="user-1")

    assert result is None

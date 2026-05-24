from src.agents.team_agent.prompt import (
    build_team_member_subagent_type,
    build_team_members_description,
    build_team_subagent_display_names,
)
from src.kernel.schemas.team import TeamMemberResponse, TeamResponse


def test_build_team_members_description():
    team = TeamResponse(
        id="t1",
        owner_user_id="u1",
        name="Dev Team",
        members=[
            TeamMemberResponse(
                member_id="m1",
                persona_preset_id="p1",
                role_name="Researcher",
                role_instructions="Focus on facts.",
                position=0,
                enabled=True,
            ),
            TeamMemberResponse(
                member_id="m2", persona_preset_id="p2", role_name="Writer", position=1, enabled=True
            ),
        ],
    )
    desc = build_team_members_description(team)
    assert "`team-m1-researcher`" in desc
    assert "Researcher" in desc
    assert "`team-m2-writer`" in desc
    assert "Writer" in desc
    assert "Focus on facts." in desc


def test_build_team_members_description_skips_disabled():
    team = TeamResponse(
        id="t1",
        owner_user_id="u1",
        name="Team",
        members=[
            TeamMemberResponse(
                member_id="m1", persona_preset_id="p1", role_name="Active", enabled=True
            ),
            TeamMemberResponse(
                member_id="m2", persona_preset_id="p2", role_name="Disabled", enabled=False
            ),
        ],
    )
    desc = build_team_members_description(team)
    assert "Active" in desc
    assert "Disabled" not in desc


def test_build_team_member_subagent_type_slugifies_display_name():
    member = TeamMemberResponse(
        member_id="m-123456789abc",
        persona_preset_id="p1",
        role_name="Research Analyst",
    )

    assert build_team_member_subagent_type(member) == "team-m-123456789abc-research-analyst"


def test_build_team_member_subagent_type_handles_non_ascii_names():
    member = TeamMemberResponse(
        member_id="m-zh",
        persona_preset_id="p1",
        role_name="研究员",
    )

    assert build_team_member_subagent_type(member) == "team-m-zh-role"


def test_build_team_subagent_display_names_maps_internal_types_to_roles():
    team = TeamResponse(
        id="t1",
        owner_user_id="u1",
        name="Dev Team",
        members=[
            TeamMemberResponse(
                member_id="m1",
                persona_preset_id="p1",
                role_name="Researcher",
                enabled=True,
            ),
            TeamMemberResponse(
                member_id="m2",
                persona_preset_id="p2",
                role_name="Disabled Role",
                enabled=False,
            ),
        ],
    )

    assert build_team_subagent_display_names(team) == {
        "team-m1-researcher": "Researcher",
    }

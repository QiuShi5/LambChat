"""Team schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.infra.utils.datetime import utc_now
from src.kernel.schemas.persona_preset import PersonaStarterPrompt

TEAM_TAGS_MAX = 20
TEAM_MEMBERS_MAX = 20
TEAM_STARTER_PROMPTS_MAX = 20
TEAM_ROUTER_ALLOWED_TOOLS_MAX = 50

TEAM_ROUTER_DELIVERY_TOOL_NAMES = frozenset(
    (
        "reveal_file",
        "reveal_project",
        "transfer_file",
        "transfer_path",
    )
)


class TeamVisibility(str, Enum):
    PRIVATE = "private"


class TeamRouterToolMode(str, Enum):
    DELIVERY_ONLY = "delivery_only"
    CUSTOM = "custom"
    ALL = "all"


def normalize_router_allowed_tools(values: list[str] | None) -> list[str]:
    """Return a bounded, stable list of router tool names."""
    seen: set[str] = set()
    result: list[str] = []
    for value in values or []:
        item = value.strip()
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
        if len(result) >= TEAM_ROUTER_ALLOWED_TOOLS_MAX:
            break
    return result


class TeamMemberCreate(BaseModel):
    """Request body for adding a member to a team."""

    member_id: Optional[str] = Field(None, min_length=1)
    persona_preset_id: str = Field(..., min_length=1)
    agent_id: Optional[str] = Field(None, min_length=1)
    model_id: Optional[str] = Field(None, min_length=1)
    sandbox_enabled: bool = False
    role_name: str = Field(default="", max_length=80)
    role_avatar: Optional[str] = None
    role_tags: list[str] = Field(default_factory=list, max_length=TEAM_TAGS_MAX)
    role_instructions: str = Field(default="", max_length=2000)
    position: int = Field(default=0, ge=0)
    enabled: bool = True


class TeamMemberUpdate(BaseModel):
    """Request body for updating a team member."""

    persona_preset_id: Optional[str] = Field(None, min_length=1)
    agent_id: Optional[str] = Field(None, min_length=1)
    model_id: Optional[str] = Field(None, min_length=1)
    sandbox_enabled: Optional[bool] = None
    role_name: Optional[str] = Field(None, max_length=80)
    role_avatar: Optional[str] = None
    role_tags: Optional[list[str]] = Field(None, max_length=TEAM_TAGS_MAX)
    role_instructions: Optional[str] = Field(None, max_length=2000)
    position: Optional[int] = Field(None, ge=0)
    enabled: Optional[bool] = None


class TeamMemberResponse(BaseModel):
    """Single team member in API responses."""

    member_id: str
    persona_preset_id: str
    agent_id: Optional[str] = None
    model_id: Optional[str] = None
    sandbox_enabled: bool = False
    role_name: str = ""
    role_avatar: Optional[str] = None
    role_tags: list[str] = Field(default_factory=list)
    role_instructions: str = ""
    position: int = 0
    enabled: bool = True


class TeamCreate(BaseModel):
    """Create team request."""

    name: str = Field(..., min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    avatar: Optional[str] = None
    tags: list[str] = Field(default_factory=list, max_length=TEAM_TAGS_MAX)
    members: list[TeamMemberCreate] = Field(default_factory=list, max_length=TEAM_MEMBERS_MAX)
    default_member_id: Optional[str] = None
    team_instructions: str = Field(default="", max_length=4000)
    router_tool_mode: TeamRouterToolMode = TeamRouterToolMode.DELIVERY_ONLY
    router_allowed_tools: list[str] = Field(
        default_factory=list,
        max_length=TEAM_ROUTER_ALLOWED_TOOLS_MAX,
    )
    starter_prompts: list[PersonaStarterPrompt] = Field(
        default_factory=list,
        max_length=TEAM_STARTER_PROMPTS_MAX,
    )

    @field_validator("tags")
    @classmethod
    def _dedupe_tags(cls, values: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for value in values:
            item = value.strip()
            if not item or item in seen:
                continue
            seen.add(item)
            result.append(item)
        return result

    @field_validator("router_allowed_tools")
    @classmethod
    def _dedupe_router_allowed_tools(cls, values: list[str]) -> list[str]:
        return normalize_router_allowed_tools(values)


class TeamUpdate(BaseModel):
    """Update team request."""

    name: Optional[str] = Field(None, min_length=1, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    avatar: Optional[str] = None
    tags: Optional[list[str]] = Field(None, max_length=TEAM_TAGS_MAX)
    members: Optional[list[TeamMemberCreate]] = Field(None, max_length=TEAM_MEMBERS_MAX)
    default_member_id: Optional[str] = None
    team_instructions: Optional[str] = Field(None, max_length=4000)
    router_tool_mode: Optional[TeamRouterToolMode] = None
    router_allowed_tools: Optional[list[str]] = Field(
        None,
        max_length=TEAM_ROUTER_ALLOWED_TOOLS_MAX,
    )
    starter_prompts: Optional[list[PersonaStarterPrompt]] = Field(
        None,
        max_length=TEAM_STARTER_PROMPTS_MAX,
    )

    @field_validator("tags")
    @classmethod
    def _dedupe_optional_tags(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return TeamCreate._dedupe_tags(values)

    @field_validator("router_allowed_tools")
    @classmethod
    def _dedupe_optional_router_allowed_tools(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return normalize_router_allowed_tools(values)


class TeamPreferenceUpdate(BaseModel):
    """Update the current user's presentation preferences for a team."""

    is_favorite: Optional[bool] = None
    is_pinned: Optional[bool] = None


class TeamResponse(BaseModel):
    """Team response model."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_user_id: str
    name: str
    description: str = ""
    avatar: Optional[str] = None
    tags: list[str] = Field(default_factory=list, max_length=TEAM_TAGS_MAX)
    members: list[TeamMemberResponse] = Field(default_factory=list, max_length=TEAM_MEMBERS_MAX)
    default_member_id: Optional[str] = None
    team_instructions: str = ""
    router_tool_mode: TeamRouterToolMode = TeamRouterToolMode.DELIVERY_ONLY
    router_allowed_tools: list[str] = Field(default_factory=list)
    starter_prompts: list[PersonaStarterPrompt] = Field(
        default_factory=list,
        max_length=TEAM_STARTER_PROMPTS_MAX,
    )
    visibility: TeamVisibility = TeamVisibility.PRIVATE
    is_favorite: bool = False
    is_pinned: bool = False
    last_used_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    @property
    def active_members(self) -> list[TeamMemberResponse]:
        return [m for m in self.members if m.enabled]


class TeamListResponse(BaseModel):
    """Paginated team list."""

    teams: list[TeamResponse]
    total: int
    skip: int = 0
    limit: int = 100

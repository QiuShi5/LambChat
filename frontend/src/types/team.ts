// frontend/src/types/team.ts

export interface TeamMember {
  member_id: string;
  persona_preset_id: string;
  role_name: string;
  role_avatar?: string | null;
  role_tags: string[];
  role_instructions: string;
  position: number;
  enabled: boolean;
}

export interface Team {
  id: string;
  owner_user_id: string;
  name: string;
  description: string;
  members: TeamMember[];
  default_member_id?: string | null;
  team_instructions: string;
  visibility: "private";
  created_at: string;
  updated_at: string;
}

export interface TeamCreateRequest {
  name: string;
  description?: string;
  members?: TeamMemberCreateRequest[];
  default_member_id?: string | null;
  team_instructions?: string;
}

export interface TeamMemberCreateRequest {
  persona_preset_id: string;
  role_instructions?: string;
  position?: number;
  enabled?: boolean;
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
  members?: TeamMemberCreateRequest[];
  default_member_id?: string | null;
  team_instructions?: string;
}

export interface TeamListResponse {
  teams: Team[];
  total: number;
  skip: number;
  limit: number;
}

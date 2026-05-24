import { authFetch } from "./fetch";
import { API_BASE } from "./config";
import type {
  Team,
  TeamCreateRequest,
  TeamListParams,
  TeamPreferenceUpdate,
  TeamUpdateRequest,
  TeamListResponse,
} from "../../types/team";

const BASE = `${API_BASE}/api/teams`;

export function buildTeamCollectionUrl(params?: TeamListParams): string;
export function buildTeamCollectionUrl(skip?: number, limit?: number): string;
export function buildTeamCollectionUrl(
  skipOrParams?: number | TeamListParams,
  limit?: number,
): string {
  const params =
    typeof skipOrParams === "object"
      ? skipOrParams
      : { skip: skipOrParams, limit };
  const searchParams = new URLSearchParams();
  if (params.skip !== undefined) searchParams.set("skip", String(params.skip));
  if (params.limit !== undefined)
    searchParams.set("limit", String(params.limit));
  if (params.q) searchParams.set("q", params.q);
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.favorite !== undefined)
    searchParams.set("favorite", String(params.favorite));
  if (params.pinned !== undefined)
    searchParams.set("pinned", String(params.pinned));
  const query = searchParams.toString();
  return `${BASE}/${query ? `?${query}` : ""}`;
}

export function buildTeamItemUrl(teamId: string): string {
  return `${BASE}/${encodeURIComponent(teamId)}`;
}

export function buildTeamCloneUrl(teamId: string): string {
  return `${buildTeamItemUrl(teamId)}/clone`;
}

export function buildTeamPreferenceUrl(teamId: string): string {
  return `${buildTeamItemUrl(teamId)}/preference`;
}

export const teamApi = {
  async list(
    skipOrParams: number | TeamListParams = 0,
    limit = 20,
  ): Promise<TeamListResponse> {
    return authFetch<TeamListResponse>(
      typeof skipOrParams === "object"
        ? buildTeamCollectionUrl(skipOrParams)
        : buildTeamCollectionUrl(skipOrParams, limit),
    );
  },

  async get(teamId: string): Promise<Team> {
    return authFetch<Team>(buildTeamItemUrl(teamId));
  },

  async create(data: TeamCreateRequest): Promise<Team> {
    return authFetch<Team>(buildTeamCollectionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async update(teamId: string, data: TeamUpdateRequest): Promise<Team> {
    return authFetch<Team>(buildTeamItemUrl(teamId), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async delete(teamId: string): Promise<void> {
    await authFetch(buildTeamItemUrl(teamId), { method: "DELETE" });
  },

  async clone(teamId: string): Promise<Team> {
    return authFetch<Team>(buildTeamCloneUrl(teamId), {
      method: "POST",
    });
  },

  async updatePreference(
    teamId: string,
    data: TeamPreferenceUpdate,
  ): Promise<Team> {
    return authFetch<Team>(buildTeamPreferenceUrl(teamId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};

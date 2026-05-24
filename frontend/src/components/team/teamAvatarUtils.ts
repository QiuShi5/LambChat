import type { Team } from "../../types/team";

export function getTeamFallbackAvatar(team: Team): string | null {
  const defaultMember =
    team.members.find(
      (member) => member.member_id === team.default_member_id,
    ) ??
    team.members.find((member) => member.enabled) ??
    team.members[0];
  return defaultMember?.role_avatar ?? null;
}

export function getTeamFallbackTag(team: Team): string {
  const defaultMember =
    team.members.find(
      (member) => member.member_id === team.default_member_id,
    ) ??
    team.members.find((member) => member.enabled) ??
    team.members[0];
  return defaultMember?.role_tags[0] ?? "";
}

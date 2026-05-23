import { Users } from "lucide-react";
import type { TeamMember } from "../../types/team";
import { TeamMemberCard } from "./TeamMemberCard";

interface TeamRosterProps {
  members: TeamMember[];
  defaultMemberId: string | null;
  onRemoveMember: (memberId: string) => void;
  onSetDefault: (memberId: string) => void;
  onToggleEnabled: (memberId: string) => void;
  onInstructionsChange: (memberId: string, text: string) => void;
}

export function TeamRoster({
  members,
  defaultMemberId,
  onRemoveMember,
  onSetDefault,
  onToggleEnabled,
  onInstructionsChange,
}: TeamRosterProps) {
  if (members.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="team-pane-header">
          <h2 className="team-pane-title">
            Team roster
            <span className="team-pane-count">0</span>
          </h2>
        </div>
        <div className="skill-empty-state flex-1">
          <Users size={28} className="skill-empty-state__icon" />
          <p className="skill-empty-state__title">No roles selected</p>
          <p className="skill-empty-state__description">
            Add roles from the library to build your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="team-pane-header">
        <h2 className="team-pane-title">
          Team roster
          <span className="team-pane-count">{members.length}</span>
        </h2>
      </div>
      <div className="team-roster-list">
        {members.map((member) => (
          <TeamMemberCard
            key={member.member_id}
            member={member}
            isDefault={member.member_id === defaultMemberId}
            onRemove={() => onRemoveMember(member.member_id)}
            onSetDefault={() => onSetDefault(member.member_id)}
            onToggleEnabled={() => onToggleEnabled(member.member_id)}
            onInstructionsChange={(text) =>
              onInstructionsChange(member.member_id, text)
            }
          />
        ))}
      </div>
    </div>
  );
}

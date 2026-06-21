import type { LucideIcon } from "lucide-react";
import { Target, Wrench, User, Users, Bot } from "lucide-react";
import type { SkillResponse } from "../../types";

export interface ChatInputSlashCommand {
  id: "goal" | "tools" | "persona" | "team" | "agent";
  command: "/goal" | "/tools" | "/persona" | "/team" | "/agent";
  labelKey: string;
  fallbackLabel: string;
  descriptionKey?: string;
  fallbackDescription?: string;
  kind: "insert" | "panel";
  icon: LucideIcon;
}

export const CHAT_INPUT_SLASH_COMMANDS: ChatInputSlashCommand[] = [
  {
    id: "goal",
    command: "/goal",
    labelKey: "chat.goal.command",
    fallbackLabel: "Goal",
    descriptionKey: "chat.goal.description",
    fallbackDescription: "Set conversation goal",
    kind: "insert",
    icon: Target,
  },
  {
    id: "tools",
    command: "/tools",
    labelKey: "chat.commands.tools",
    fallbackLabel: "Tools",
    kind: "panel",
    icon: Wrench,
  },
  {
    id: "team",
    command: "/team",
    labelKey: "chat.commands.team",
    fallbackLabel: "Team",
    kind: "panel",
    icon: Users,
  },
  {
    id: "persona",
    command: "/persona",
    labelKey: "chat.commands.persona",
    fallbackLabel: "Persona",
    kind: "panel",
    icon: User,
  },
  {
    id: "agent",
    command: "/agent",
    labelKey: "chat.commands.agent",
    fallbackLabel: "Agent",
    kind: "panel",
    icon: Bot,
  },
];

// ── Unified dropdown item (command or skill) ──────────────────────────

export type SlashDropdownItem =
  | { type: "command"; command: ChatInputSlashCommand }
  | {
      type: "skill";
      skill: Pick<SkillResponse, "name" | "description" | "tags">;
    };

export interface SlashDropdownSection {
  kind: "commands" | "skills";
  labelKey: string;
  fallbackLabel: string;
  items: SlashDropdownItem[];
}

// ── Query helpers ───────────────────────────────────────────────────

export function getSlashCommandQuery(
  input: string,
  cursorPosition: number,
): string | null {
  const beforeCursor = input.slice(0, cursorPosition);
  if (!beforeCursor.startsWith("/")) return null;
  if (beforeCursor.includes(" ") || beforeCursor.includes("\n")) return null;
  return beforeCursor.slice(1).toLowerCase();
}

/**
 * Matches built-in commands only (kept for backward compat / tests).
 */
export function getMatchingSlashCommands(
  input: string,
  cursorPosition: number,
): ChatInputSlashCommand[] {
  const query = getSlashCommandQuery(input, cursorPosition);
  if (query === null) return [];
  return CHAT_INPUT_SLASH_COMMANDS.filter((item) =>
    item.command.slice(1).startsWith(query),
  );
}

/**
 * Matches both built-in commands **and** enabled skills.
 * Returns a flat array of `SlashDropdownItem`s.
 */
export function getMatchingSlashDropdownItems(
  input: string,
  cursorPosition: number,
  enabledSkills?: SkillResponse[],
): SlashDropdownItem[] {
  const query = getSlashCommandQuery(input, cursorPosition);
  if (query === null) return [];

  const items: SlashDropdownItem[] = [];

  // Built-in commands
  for (const cmd of CHAT_INPUT_SLASH_COMMANDS) {
    if (cmd.command.slice(1).startsWith(query)) {
      items.push({ type: "command", command: cmd });
    }
  }

  // Enabled skills (pre-filtered by caller)
  if (enabledSkills) {
    for (const skill of enabledSkills) {
      if (skill.name.toLowerCase().startsWith(query)) {
        items.push({
          type: "skill",
          skill: {
            name: skill.name,
            description: skill.description,
            tags: skill.tags,
          },
        });
      }
    }
  }

  return items;
}

/**
 * Groups flat dropdown items into sections for rendering.
 */
export function getSlashDropdownSections(
  items: SlashDropdownItem[],
): SlashDropdownSection[] {
  const commands = items.filter((i) => i.type === "command");
  const skills = items.filter((i) => i.type === "skill");
  const sections: SlashDropdownSection[] = [];

  if (commands.length > 0) {
    sections.push({
      kind: "commands",
      labelKey: "chat.slashCommands.commands",
      fallbackLabel: "Commands",
      items: commands,
    });
  }
  if (skills.length > 0) {
    sections.push({
      kind: "skills",
      labelKey: "chat.slashCommands.skills",
      fallbackLabel: "Skills",
      items: skills,
    });
  }

  return sections;
}

// ── Input mutation helpers ──────────────────────────────────────────

export function applySlashCommandSelection(
  input: string,
  cursorPosition: number,
  command: ChatInputSlashCommand,
): { input: string; cursorPosition: number } {
  const beforeCursor = input.slice(0, cursorPosition);
  const afterCursor = input.slice(cursorPosition);
  const commandStart = beforeCursor.startsWith("/") ? 0 : cursorPosition;
  const nextInput = `${input.slice(0, commandStart)}${
    command.command
  } ${afterCursor}`;
  const nextCursorPosition = commandStart + command.command.length + 1;
  return { input: nextInput, cursorPosition: nextCursorPosition };
}

/**
 * Clears the `/query` prefix from the input (used when selecting a skill).
 */
export function clearSlashCommandInput(
  input: string,
  cursorPosition: number,
): { input: string; cursorPosition: number } {
  const beforeCursor = input.slice(0, cursorPosition);
  if (beforeCursor.startsWith("/")) {
    return {
      input: input.slice(cursorPosition),
      cursorPosition: 0,
    };
  }
  return { input, cursorPosition };
}

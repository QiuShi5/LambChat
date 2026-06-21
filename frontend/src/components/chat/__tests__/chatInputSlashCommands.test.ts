import test from "node:test";
import assert from "node:assert/strict";

import {
  CHAT_INPUT_SLASH_COMMANDS,
  applySlashCommandSelection,
  clearSlashCommandInput,
  getMatchingSlashCommands,
  getMatchingSlashDropdownItems,
  getSlashDropdownSections,
  getSlashCommandQuery,
} from "../chatInputSlashCommands.ts";
import type { SkillResponse } from "../../../types";

const mockSkills: SkillResponse[] = [
  {
    name: "deep-research",
    description: "Deep research harness",
    tags: [],
    enabled: true,
    source: "marketplace",
    file_count: 0,
    files: {},
    installed_from: "manual",
    is_published: false,
    marketplace_is_active: false,
  },
  {
    name: "code-review",
    description: "Code review assistant",
    tags: [],
    enabled: true,
    source: "manual",
    file_count: 0,
    files: {},
    installed_from: "manual",
    is_published: false,
    marketplace_is_active: false,
  },
  {
    name: "team-builder",
    description: "Build teams easily",
    tags: [],
    enabled: true,
    source: "marketplace",
    file_count: 0,
    files: {},
    installed_from: "manual",
    is_published: false,
    marketplace_is_active: false,
  },
];

// ── Legacy getMatchingSlashCommands ────────────────────────────────

test("finds the goal command while typing a slash command prefix", () => {
  assert.equal(getSlashCommandQuery("/go", 3), "go");
  assert.deepEqual(getMatchingSlashCommands("/go", 3), [
    CHAT_INPUT_SLASH_COMMANDS[0],
  ]);
});

test("finds panel commands while typing a slash command prefix", () => {
  assert.deepEqual(
    getMatchingSlashCommands("/to", 3).map((command) => command.id),
    ["tools"],
  );
  assert.deepEqual(
    getMatchingSlashCommands("/t", 2).map((command) => command.id),
    ["tools", "team"],
  );
});

test("does not show slash commands after text content has started", () => {
  assert.equal(getSlashCommandQuery("please /go", 10), null);
  assert.deepEqual(getMatchingSlashCommands("/goal write docs", 16), []);
});

test("selecting goal command inserts a trailing space for direct goal text", () => {
  assert.deepEqual(
    applySlashCommandSelection("/go", 3, CHAT_INPUT_SLASH_COMMANDS[0]),
    {
      input: "/goal ",
      cursorPosition: 6,
    },
  );
});

// ── clearSlashCommandInput ────────────────────────────────────────

test("clears slash prefix from input", () => {
  assert.deepEqual(clearSlashCommandInput("/deep-research", 14), {
    input: "",
    cursorPosition: 0,
  });
  assert.deepEqual(clearSlashCommandInput("/go", 3), {
    input: "",
    cursorPosition: 0,
  });
  assert.deepEqual(clearSlashCommandInput("hello", 5), {
    input: "hello",
    cursorPosition: 5,
  });
});

// ── getMatchingSlashDropdownItems ──────────────────────────────────

test("matches enabled skills by name prefix", () => {
  const items = getMatchingSlashDropdownItems("/deep", 5, mockSkills);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "skill");
  if (items[0].type === "skill") {
    assert.equal(items[0].skill.name, "deep-research");
    assert.equal(items[0].skill.description, "Deep research harness");
  }
});

test("does not match skills when not provided", () => {
  const items = getMatchingSlashDropdownItems("/code", 5, undefined);
  const skills = items.filter((i) => i.type === "skill");
  assert.equal(skills.length, 0);
});

test("returns both commands and skills mixed", () => {
  const items = getMatchingSlashDropdownItems("/t", 2, mockSkills);
  // Should match /tools, /team (commands) and team-builder (skill)
  assert.equal(items.length, 3);
  assert.equal(items[0].type, "command");
  assert.equal(items[1].type, "command");
  assert.equal(items[2].type, "skill");
  if (items[2].type === "skill") {
    assert.equal(items[2].skill.name, "team-builder");
  }
});

test("returns only commands when no skills match", () => {
  const items = getMatchingSlashDropdownItems("/sta", 4, mockSkills);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "command");
  if (items[0].type === "command") {
    assert.equal(items[0].command.id, "status");
  }
});

test("returns only skills when no commands match", () => {
  const items = getMatchingSlashDropdownItems("/code", 5, mockSkills);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, "skill");
  if (items[0].type === "skill") {
    assert.equal(items[0].skill.name, "code-review");
  }
});

test("empty array when no match", () => {
  assert.deepEqual(getMatchingSlashDropdownItems("/xyz", 4, mockSkills), []);
});

// ── getSlashDropdownSections ───────────────────────────────────────

test("groups items into commands and skills sections", () => {
  const items = [
    { type: "command" as const, command: CHAT_INPUT_SLASH_COMMANDS[0] },
    {
      type: "skill" as const,
      skill: { name: "test", description: "Test skill", tags: ["code"] },
    },
  ];
  const sections = getSlashDropdownSections(items);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].kind, "commands");
  assert.equal(sections[0].items.length, 1);
  assert.equal(sections[1].kind, "skills");
  assert.equal(sections[1].items.length, 1);
});

test("only returns commands section when no skills", () => {
  const items = [
    { type: "command" as const, command: CHAT_INPUT_SLASH_COMMANDS[0] },
  ];
  const sections = getSlashDropdownSections(items);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].kind, "commands");
});

test("only returns skills section when no commands", () => {
  const items = [
    {
      type: "skill" as const,
      skill: { name: "test", description: "Test skill", tags: [] },
    },
  ];
  const sections = getSlashDropdownSections(items);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].kind, "skills");
});

test("returns empty array when no items", () => {
  const sections = getSlashDropdownSections([]);
  assert.deepEqual(sections, []);
});

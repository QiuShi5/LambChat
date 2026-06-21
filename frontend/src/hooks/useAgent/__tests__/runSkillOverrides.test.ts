import test from "node:test";
import assert from "node:assert/strict";

import { resolveRunEnabledSkills } from "../runSkillOverrides.ts";

test("uses a per-run skills whitelist before persona skills", () => {
  assert.deepEqual(
    resolveRunEnabledSkills({
      personaPresetId: "preset-1",
      personaEnabledSkills: ["persona-skill"],
      runEnabledSkills: ["selected-skill"],
    }),
    ["selected-skill"],
  );
});

test("falls back to persona skills when there is no per-run whitelist", () => {
  assert.deepEqual(
    resolveRunEnabledSkills({
      personaPresetId: "preset-1",
      personaEnabledSkills: ["persona-skill"],
    }),
    ["persona-skill"],
  );
});

test("keeps an empty per-run whitelist as no skills for this run", () => {
  assert.deepEqual(
    resolveRunEnabledSkills({
      personaPresetId: "preset-1",
      personaEnabledSkills: ["persona-skill"],
      runEnabledSkills: [],
    }),
    [],
  );
});

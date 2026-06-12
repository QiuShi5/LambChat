import assert from "node:assert/strict";
import test from "node:test";

import {
  buildScheduledTaskInputPayload,
  getScheduledTaskPersonaPresetId,
  getScheduledTaskTeamId,
} from "../scheduledTaskPayload.ts";

test("clearing the model removes stale scheduled task agent options", () => {
  assert.deepEqual(
    buildScheduledTaskInputPayload(
      {
        message: "run",
        agent_options: {
          model_id: "old-model-id",
          model: "old-model",
          _resolved_model_config: { id: "old-model-id" },
        },
      },
      {
        agentId: "fast",
        modelId: "",
        modelValue: "",
        availableModels: null,
      },
    ),
    {
      message: "run",
    },
  );
});

test("clearing the model preserves non-model agent options", () => {
  assert.deepEqual(
    buildScheduledTaskInputPayload(
      {
        message: "run",
        agent_options: {
          model_id: "old-model-id",
          temperature: 0.2,
        },
      },
      {
        agentId: "fast",
        modelId: "",
        modelValue: "",
        availableModels: null,
      },
    ),
    {
      message: "run",
      agent_options: {
        temperature: 0.2,
      },
    },
  );
});

test("non-team scheduled tasks store only persona id", () => {
  assert.deepEqual(
    buildScheduledTaskInputPayload(
      {
        message: "run",
        team_id: "team-old",
      },
      {
        agentId: "fast",
        modelId: "",
        modelValue: "",
        availableModels: null,
        personaPresetId: "persona-1",
        teamId: "team-1",
      },
    ),
    {
      message: "run",
      persona_preset_id: "persona-1",
    },
  );
});

test("team scheduled tasks store only team id", () => {
  assert.deepEqual(
    buildScheduledTaskInputPayload(
      {
        message: "run",
        persona_preset_id: "persona-old",
      },
      {
        agentId: "team",
        modelId: "",
        modelValue: "",
        availableModels: null,
        personaPresetId: "persona-1",
        teamId: "team-1",
      },
    ),
    {
      message: "run",
      team_id: "team-1",
    },
  );
});

test("scheduled task payload id readers ignore wrong types", () => {
  assert.equal(
    getScheduledTaskPersonaPresetId({ persona_preset_id: "persona-1" }),
    "persona-1",
  );
  assert.equal(getScheduledTaskPersonaPresetId({ persona_preset_id: 1 }), "");
  assert.equal(getScheduledTaskTeamId({ team_id: "team-1" }), "team-1");
  assert.equal(getScheduledTaskTeamId({ team_id: null }), "");
});

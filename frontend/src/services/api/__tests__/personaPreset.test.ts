import test from "node:test";
import assert from "node:assert/strict";

import { buildPersonaPresetPreferenceUrl } from "../personaPreset.ts";

test("buildPersonaPresetPreferenceUrl encodes preset ids", () => {
  assert.equal(
    buildPersonaPresetPreferenceUrl("preset/1"),
    "/api/persona-presets/preset%2F1/preference",
  );
});

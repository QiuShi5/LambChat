import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panelSource = readFileSync(
  new URL("../AgentModelPanel.tsx", import.meta.url),
  "utf8",
);
const agentSectionSource = readFileSync(
  new URL("../AgentSection.tsx", import.meta.url),
  "utf8",
);
const globalAgentTabSource = readFileSync(
  new URL("../../AgentPanel/tabs/GlobalAgentTab.tsx", import.meta.url),
  "utf8",
);
const rolesAgentTabSource = readFileSync(
  new URL("../../AgentPanel/tabs/RolesAgentTab.tsx", import.meta.url),
  "utf8",
);
const rolesModelTabSource = readFileSync(
  new URL("../../ModelPanel/tabs/RolesModelTab.tsx", import.meta.url),
  "utf8",
);

test("agent model panel uses a compact console layout", () => {
  assert.match(panelSource, /agent-model-console/);
  assert.match(panelSource, /agent-model-hero/);
  assert.match(panelSource, /agent-model-section-tabs/);
  assert.match(agentSectionSource, /agent-section-overview/);
});

test("agent and model assignment rows use compact scan-friendly lists", () => {
  assert.match(globalAgentTabSource, /agent-config-list/);
  assert.match(rolesAgentTabSource, /agent-config-list/);
  assert.match(rolesModelTabSource, /agent-config-list/);
});

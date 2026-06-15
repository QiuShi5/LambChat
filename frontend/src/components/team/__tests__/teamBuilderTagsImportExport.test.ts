import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wrapperSource = readFileSync(
  new URL("../TeamBuilderWrapper.tsx", import.meta.url),
  "utf8",
);
const builderSource = readFileSync(
  new URL("../TeamBuilder.tsx", import.meta.url),
  "utf8",
);

test("team builder list exposes search, tag filter, import, and export controls", () => {
  assert.match(wrapperSource, /searchValue=\{query\}/);
  assert.match(wrapperSource, /searchAccessory=/);
  assert.match(wrapperSource, /PersonaTagFilterDropdown/);
  assert.match(wrapperSource, /handleExport/);
  assert.match(wrapperSource, /handleImportFile/);
  assert.match(wrapperSource, /Download/);
  assert.match(wrapperSource, /Upload/);
});

test("team editor persists team tags", () => {
  assert.match(builderSource, /teamTagsInput/);
  assert.match(builderSource, /inputToTags\(teamTagsInput\)/);
  assert.match(builderSource, /tagsToInput\(team\.tags\)/);
});

test("team editor persists member model overrides", () => {
  assert.match(builderSource, /model_id:\s*null/);
  assert.match(builderSource, /model_id:\s*m\.model_id \?\? null/);
  assert.match(builderSource, /handleModelChange/);
  assert.match(builderSource, /modelApi\s*\.\s*listAvailable\(\)/);
  assert.match(builderSource, /useOptionalSettingsContext/);
  assert.match(wrapperSource, /record\.model_id/);
  assert.match(
    wrapperSource,
    /model_id:\s*[\s\S]*record\.model_id[\s\S]*:\s*null/,
  );
});

test("team editor persists member agent mode overrides", () => {
  assert.match(builderSource, /agent_id:\s*null/);
  assert.match(builderSource, /agent_id:\s*m\.agent_id \?\? null/);
  assert.match(builderSource, /handleAgentChange/);
  assert.match(builderSource, /agentApi\s*\.\s*list\(\)/);
  assert.match(wrapperSource, /record\.agent_id/);
  assert.match(
    wrapperSource,
    /agent_id:\s*[\s\S]*record\.agent_id[\s\S]*:\s*null/,
  );
});

test("team editor persists router tool policy", () => {
  assert.match(builderSource, /routerToolMode/);
  assert.match(builderSource, /routerAllowedTools/);
  assert.match(
    builderSource,
    /setRouterToolMode\(team\.router_tool_mode \?\? "delivery_only"\)/,
  );
  assert.match(builderSource, /router_tool_mode:\s*routerToolMode/);
  assert.match(
    builderSource,
    /router_allowed_tools:\s*[\s\S]*routerToolMode === "custom"[\s\S]*routerAllowedTools/,
  );
  assert.match(builderSource, /ROUTER_DELIVERY_TOOL_NAMES/);
  assert.match(builderSource, /ROUTER_CUSTOM_TOOL_OPTIONS/);
  assert.match(builderSource, /setRouterToolMode\("all"\)/);
});

test("team import keeps router tool policy fields", () => {
  assert.match(wrapperSource, /normalizeImportedRouterToolMode/);
  assert.match(wrapperSource, /normalizeImportedRouterAllowedTools/);
  assert.match(
    wrapperSource,
    /router_tool_mode:\s*normalizeImportedRouterToolMode/,
  );
  assert.match(
    wrapperSource,
    /router_allowed_tools:\s*normalizeImportedRouterAllowedTools/,
  );
});

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

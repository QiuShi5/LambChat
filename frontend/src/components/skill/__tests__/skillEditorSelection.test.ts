import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../SkillEditor.tsx", import.meta.url),
  "utf8",
);

test("SkillEditor keeps CodeMirror text selection visible and selectable", () => {
  assert.match(source, /"\.cm-content":\s*\{[\s\S]*minHeight:\s*"100%"/);
  assert.match(
    source,
    /"\.cm-content":\s*\{[\s\S]*backgroundColor:\s*"transparent !important"/,
  );
  assert.match(source, /"\.cm-content":\s*\{[\s\S]*userSelect:\s*"text"/);
  assert.match(source, /"\.cm-line":\s*\{[\s\S]*userSelect:\s*"text"/);
  assert.match(
    source,
    /"\.cm-lineNumbers \.cm-gutterElement":\s*\{[\s\S]*userSelect:\s*"none"/,
  );
});

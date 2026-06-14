import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const approvalCss = readFileSync(
  new URL("../approval.css", import.meta.url),
  "utf8",
);
const askHumanSource = readFileSync(
  new URL(
    "../../components/chat/ChatMessage/items/AskHumanItem.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("approval card uses shared section spacing for content blocks", () => {
  assert.match(approvalCss, /--approval-section-x:\s*1\.25rem;/);
  assert.match(approvalCss, /--approval-section-y:\s*0\.875rem;/);
  assert.match(
    approvalCss,
    /\.approval-divider\s*\{[\s\S]*?margin:\s*0 var\(--approval-section-x\);/,
  );
  assert.match(
    approvalCss,
    /\.approval-result-section\s*\{[\s\S]*?padding:\s*var\(--approval-section-y\) var\(--approval-section-x\);/,
  );
  assert.doesNotMatch(askHumanSource, /className="px-5 pb-4"/);
  assert.match(askHumanSource, /className="approval-result-section"/);
});

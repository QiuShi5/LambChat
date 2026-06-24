import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../ToolSelector.tsx", import.meta.url),
  "utf8",
);

test("tool selector exposes a search module for all tool categories", () => {
  assert.match(source, /Search,/);
  assert.match(
    source,
    /const \[searchQuery, setSearchQuery\] = useState\(""\)/,
  );
  assert.match(source, /placeholder=\{t\("tools\.searchPlaceholder"\)\}/);
  assert.match(source, /value=\{searchQuery\}/);
  assert.match(
    source,
    /onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}/,
  );
});

test("tool selector filters tools before grouping and pagination", () => {
  assert.match(source, /const filteredTools = useMemo/);
  assert.match(source, /tool\.name/);
  assert.match(source, /tool\.description/);
  assert.match(source, /tool\.server/);
  assert.match(source, /t\(`tools\.categories\.\$\{tool\.category\}`\)/);
  assert.match(source, /tool\.parameters\?\.flatMap/);
  assert.match(source, /total: filteredTools\.length/);
  assert.match(source, /createPagedGroups\(filteredTools/);
  assert.match(source, /total=\{filteredTools\.length\}/);
});

test("tool selector shows an empty search result state", () => {
  assert.match(source, /filteredTools\.length === 0/);
  assert.match(source, /t\("tools\.noMatchingTools"\)/);
});

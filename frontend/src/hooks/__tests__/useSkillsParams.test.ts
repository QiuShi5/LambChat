import test from "node:test";
import assert from "node:assert/strict";

import { resolveSkillListParams } from "../useSkills.ts";

test("resolveSkillListParams requests one page by default", () => {
  assert.deepEqual(resolveSkillListParams(undefined, undefined), {
    limit: 20,
  });
});

test("resolveSkillListParams gives explicit fetch params priority", () => {
  assert.deepEqual(
    resolveSkillListParams({ skip: 20, limit: 20 }, { limit: 50 }),
    { skip: 20, limit: 20 },
  );
});

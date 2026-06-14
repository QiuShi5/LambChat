import assert from "node:assert/strict";
import test from "node:test";

import {
  clearMissingSelections,
  isEveryVisibleSessionSelected,
  toggleAllVisibleSessions,
  toggleSessionSelection,
} from "../sessionSelection.ts";

test("toggleSessionSelection adds and removes one session id", () => {
  const first = toggleSessionSelection(new Set(), "session-1");
  assert.deepEqual(Array.from(first), ["session-1"]);

  const second = toggleSessionSelection(first, "session-1");
  assert.deepEqual(Array.from(second), []);
});

test("toggleAllVisibleSessions selects all visible ids or clears them", () => {
  const visibleIds = ["session-1", "session-2", "session-3"];

  const selected = toggleAllVisibleSessions(new Set(["session-9"]), visibleIds);
  assert.deepEqual(Array.from(selected).sort(), [
    "session-1",
    "session-2",
    "session-3",
    "session-9",
  ]);

  const cleared = toggleAllVisibleSessions(selected, visibleIds);
  assert.deepEqual(Array.from(cleared), ["session-9"]);
});

test("isEveryVisibleSessionSelected ignores empty visible lists", () => {
  assert.equal(isEveryVisibleSessionSelected(new Set(), []), false);
  assert.equal(
    isEveryVisibleSessionSelected(new Set(["session-1", "session-2"]), [
      "session-1",
      "session-2",
    ]),
    true,
  );
});

test("clearMissingSelections removes ids that are no longer loaded", () => {
  const selected = clearMissingSelections(
    new Set(["session-1", "session-2", "session-3"]),
    ["session-2", "session-3", "session-4"],
  );

  assert.deepEqual(Array.from(selected).sort(), ["session-2", "session-3"]);
});

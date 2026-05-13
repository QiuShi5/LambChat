import test from "node:test";
import assert from "node:assert/strict";

import { SIDEBAR_RAIL_SKELETON_NAV_STYLE } from "../SidebarSkeleton.tsx";

test("collapsed sidebar skeleton rail uses the theme border color explicitly", () => {
  assert.equal(
    SIDEBAR_RAIL_SKELETON_NAV_STYLE.borderRight,
    "1px solid var(--theme-border)",
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      SIDEBAR_RAIL_SKELETON_NAV_STYLE,
      "borderColor",
    ),
    false,
  );
});

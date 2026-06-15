import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/notification/NotificationBanner.tsx"),
  "utf8",
);

test("notification banner opens a detail dialog from the compact card", () => {
  assert.match(source, /selectedNotification/);
  assert.match(source, /setSelectedNotification\(current\)/);
  assert.match(source, /createPortal/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /notification-banner-detail/);
});

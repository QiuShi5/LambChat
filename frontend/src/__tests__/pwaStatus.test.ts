import test from "node:test";
import assert from "node:assert/strict";
import {
  getInitialOnlineStatus,
  shouldShowRestoredConnectionToast,
} from "../pwaStatus.ts";

test("treats missing navigator online state as online by default", () => {
  assert.equal(getInitialOnlineStatus(undefined), true);
  assert.equal(getInitialOnlineStatus({}), true);
});

test("reads explicit browser online state", () => {
  assert.equal(getInitialOnlineStatus({ onLine: true }), true);
  assert.equal(getInitialOnlineStatus({ onLine: false }), false);
});

test("shows restored connection feedback only after an offline state", () => {
  assert.equal(
    shouldShowRestoredConnectionToast({
      wasOnline: false,
      isOnline: true,
    }),
    true,
  );
  assert.equal(
    shouldShowRestoredConnectionToast({
      wasOnline: true,
      isOnline: true,
    }),
    false,
  );
  assert.equal(
    shouldShowRestoredConnectionToast({
      wasOnline: false,
      isOnline: false,
    }),
    false,
  );
});

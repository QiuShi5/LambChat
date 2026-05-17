import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const appSource = readFileSync(resolve(import.meta.dirname, "../App.tsx"), {
  encoding: "utf8",
});
const componentSource = readIfExists(
  resolve(import.meta.dirname, "../components/pwa/PwaStatusToasts.tsx"),
);

test("App mounts the PWA status toast bridge near the global toaster", () => {
  assert.match(appSource, /PwaStatusToasts/);
  assert.match(appSource, /<Toaster/);
});

test("PWA status toast bridge handles update, offline, and restored-online events", () => {
  assert.match(componentSource, /PWA_UPDATE_AVAILABLE_EVENT/);
  assert.match(componentSource, /activateWaitingLambChatPwaUpdate/);
  assert.match(componentSource, /addEventListener\("offline"/);
  assert.match(componentSource, /addEventListener\("online"/);
  assert.match(componentSource, /toast\.custom/);
});

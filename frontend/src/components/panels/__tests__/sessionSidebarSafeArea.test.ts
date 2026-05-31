import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  resolve(__dirname, "../SessionSidebar.tsx"),
  "utf8",
);

function mobileSidebarPanelClass() {
  return Array.from(
    source.matchAll(/className=\{`(?<className>[^`]*fixed left-0[\s\S]*?)`\}/g),
  )
    .map((match) => match.groups?.className ?? "")
    .find((className) => className.includes("bg-[var(--theme-bg-sidebar)]"));
}

function mobileSidebarPanelStyle() {
  const panelClass = mobileSidebarPanelClass();
  if (!panelClass) return undefined;
  const classStart = source.indexOf(`className={\`${panelClass}\`}`);
  return source.slice(classStart).match(/style=\{\{(?<style>[\s\S]*?)\}\}/)
    ?.groups?.style;
}

test("mobile sidebar overlay starts below the iOS safe-area top inset", () => {
  const overlayBlock = source.match(
    /className=\{`fixed left-0 right-0 z-\[60\][\s\S]*?style=\{\{(?<style>[\s\S]*?)\}\}/,
  )?.groups?.style;

  assert.ok(overlayBlock, "mobile overlay block should be present");
  assert.match(overlayBlock, /top:\s*"env\(safe-area-inset-top\)"/);
  assert.match(
    overlayBlock,
    /height:\s*"calc\(var\(--app-viewport-height, 100dvh\) - env\(safe-area-inset-top\)\)"/,
  );
});

test("mobile sidebar panel starts below the iOS safe-area top inset", () => {
  const panelBlock = mobileSidebarPanelStyle();

  assert.ok(panelBlock, "mobile sidebar panel block should be present");
  assert.match(panelBlock, /top:\s*"env\(safe-area-inset-top\)"/);
  assert.match(
    panelBlock,
    /height:\s*"calc\(var\(--app-viewport-height, 100dvh\) - env\(safe-area-inset-top\)\)"/,
  );
  assert.doesNotMatch(panelBlock, /paddingTop:\s*"env\(safe-area-inset-top\)"/);
});

test("mobile sidebar panel fills the viewport width", () => {
  const panelClass = mobileSidebarPanelClass();

  assert.ok(panelClass, "mobile sidebar panel class should be present");
  assert.match(panelClass, /\bw-full\b/);
  assert.doesNotMatch(panelClass, /\bw-64\b/);
  assert.doesNotMatch(panelClass, /\brounded-r-lg\b/);
});

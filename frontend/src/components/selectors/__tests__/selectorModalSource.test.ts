import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(relativePath: string): string {
  const url = new URL(relativePath, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}

const modalSource = readSource("../shared/SelectorModal.tsx");
const shellSource = readSource("../shared/SelectorModalShell.tsx");
const headerSource = readSource("../shared/SelectorModalHeader.tsx");
const actionBarSource = readSource("../shared/SelectorActionBar.tsx");
const sharedIndexSource = readSource("../shared/index.ts");
const consumers = [
  "../AgentModeSelector.tsx",
  "../SkillSelector.tsx",
  "../ToolSelector.tsx",
];

test("selector modals share the portal overlay and viewport wrapper", () => {
  assert.match(modalSource, /export function SelectorModalPortal\(/);
  assert.match(
    modalSource,
    /className="fixed inset-0 z-\[300\] bg-black\/50 animate-fade-in"/,
  );
  assert.match(
    modalSource,
    /className="safe-area-viewport-padding fixed z-\[301\] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 inset-x-0 bottom-0 animate-slide-up sm:animate-scale-in"/,
  );

  for (const relativePath of consumers) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /SelectorModalPortal/,
      `${relativePath} should import SelectorModalPortal from shared selector infrastructure`,
    );
    assert.match(
      source,
      /<SelectorModalPortal/,
      `${relativePath} should render selector modals through the shared portal`,
    );
    assert.doesNotMatch(
      source,
      /fixed inset-0 z-\[300\] bg-black\/50 animate-fade-in/,
      `${relativePath} should not duplicate the modal overlay classes`,
    );
    assert.doesNotMatch(
      source,
      /safe-area-viewport-padding fixed z-\[301\] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 inset-x-0 bottom-0 animate-slide-up sm:animate-scale-in/,
      `${relativePath} should not duplicate the modal viewport wrapper classes`,
    );
  }
});

test("selector modals share the content shell without changing its classes", () => {
  assert.match(shellSource, /export const SELECTOR_MODAL_SHELL_CLASS/);
  assert.match(sharedIndexSource, /export \{ SelectorModalShell \}/);
  assert.match(
    shellSource,
    /sm:rounded-2xl rounded-t-2xl shadow-2xl w-full sm:w-\[40%\] sm:min-w-\[600px\] min-h-\[40vh\] sm:max-h-\[80vh\] max-h-\[85vh\] max-h-\[85dvh\] flex flex-col overflow-hidden/,
  );
  assert.match(shellSource, /background: "var\(--theme-bg-card\)"/);
  assert.match(
    shellSource,
    /onClick=\{\(event\) => event\.stopPropagation\(\)\}/,
  );

  for (const relativePath of consumers) {
    const source = readSource(relativePath);
    assert.match(
      source,
      /SelectorModalShell/,
      `${relativePath} should import SelectorModalShell from shared selector infrastructure`,
    );
    assert.match(
      source,
      /<SelectorModalShell/,
      `${relativePath} should render the shared selector content shell`,
    );
  }
});

test("selector modals share the header and action bar styles", () => {
  assert.match(headerSource, /export function SelectorModalHeader/);
  assert.match(
    headerSource,
    /flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b/,
  );
  assert.match(
    headerSource,
    /absolute left-1\/2 -translate-x-1\/2 top-2 w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 sm:hidden/,
  );
  assert.match(
    headerSource,
    /p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 transition-colors/,
  );

  assert.match(actionBarSource, /export function SelectorActionBar/);
  assert.match(
    actionBarSource,
    /flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2\.5 border-b border-stone-200\/80 dark:border-stone-700\/80 bg-stone-50\/80 dark:bg-stone-800\/50/,
  );
  assert.match(
    actionBarSource,
    /px-3 py-2 sm:py-1\.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 rounded-lg transition-colors/,
  );
});

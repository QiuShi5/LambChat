import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("mobile tool result panel slide-in keeps the sheet opaque", () => {
  const componentSource = readFileSync(
    new URL("../ToolResultPanel.tsx", import.meta.url),
    "utf8",
  );
  const animationsSource = readFileSync(
    new URL("../../../../../styles/animations.css", import.meta.url),
    "utf8",
  );
  const slideUpAnimation = animationsSource.match(
    /@keyframes\s+slide-up-fullscreen\s*\{(?<body>[\s\S]*?)\n\}/,
  )?.groups?.body;

  assert.ok(slideUpAnimation, "slide-up-fullscreen animation should exist");
  assert.doesNotMatch(
    slideUpAnimation,
    /\bopacity\s*:/,
    "sliding the mobile sheet should not reveal content underneath",
  );
  assert.doesNotMatch(
    componentSource,
    /transform:\s*"translateY\(100%\)"\s*,\s*opacity:\s*0/,
    "pre-animation mobile sheet state should keep its opaque background",
  );
});

test("mobile swipe-to-close is limited to the explicit drag handle", () => {
  const componentSource = readFileSync(
    new URL("../ToolResultPanel.tsx", import.meta.url),
    "utf8",
  );
  const swipeHookSource = readFileSync(
    new URL("../../../../../hooks/useSwipeToClose.ts", import.meta.url),
    "utf8",
  );
  const sidebarPanelHookSource = readFileSync(
    new URL("../../../../../hooks/useSidebarPanel.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    swipeHookSource,
    /dragHandleRef\?: RefObject<HTMLElement \| null>/,
    "swipe hook should support an explicit drag handle ref",
  );
  assert.match(
    sidebarPanelHookSource,
    /dragHandleRef,\s*\}\);/,
    "sidebar panel hook should pass its drag handle into the swipe hook",
  );
  assert.match(
    componentSource,
    /ref=\{dragHandleRef\}/,
    "tool result panel should attach the swipe handle ref to the visible mobile handle",
  );
});

test("explicit close button reports a user close before closing the panel", () => {
  const componentSource = readFileSync(
    new URL("../ToolResultPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    componentSource,
    /onUserClose\?: \(\) => void/,
    "tool result panel should expose an explicit user-close callback",
  );
  assert.match(
    componentSource,
    /const handleUserClose = useCallback\(\(\) => \{\s*onUserClose\?\.\(\);\s*clearSidebarHistory\(\);\s*onClose\(\);/s,
    "close button should notify user-close handlers before closing",
  );
  assert.match(
    componentSource,
    /useSidebarPanel\(\{\s*open,\s*onClose: handleUserClose,/s,
    "keyboard and swipe close paths should use the same user-close handler",
  );
});

test("tool result overlay reserves vertical safe-area spacing", () => {
  const componentSource = readFileSync(
    new URL("../ToolResultPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    componentSource,
    /className=\{`safe-area-viewport-padding fixed inset-0 z-\[200\] flex flex-col/,
    "tool result overlay should keep sidebar, center, and fullscreen panels inside vertical safe areas",
  );
});

test("tool result header truncates long titles and subtitles on narrow screens", () => {
  const componentSource = readFileSync(
    new URL("../ToolResultPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    componentSource,
    /className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden"/,
    "title row should clip overflowing text within the available header space",
  );
  assert.match(
    componentSource,
    /className="min-w-0 max-w-\[40%\] truncate font-medium text-sm text-theme-text"/,
    "title should not expand beyond its content, but should still shrink and truncate",
  );
  assert.match(
    componentSource,
    /className="inline-flex h-5 min-w-0 max-w-\[45vw\] sm:max-w-\[min\(28rem,45%\)\] items-center justify-start overflow-hidden rounded-full bg-theme-bg-subtle px-1 text-\[10px\] font-semibold leading-none text-theme-text-secondary"/,
    "subtitle pill should shrink, cap its responsive width, and truncate long prompt text",
  );
  assert.match(
    componentSource,
    /<span className="block min-w-0 truncate">\s*\{subtitle\}\s*<\/span>/s,
    "subtitle text should truncate from the start edge instead of being centered inside the pill",
  );
});

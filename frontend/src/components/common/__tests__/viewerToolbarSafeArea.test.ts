import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../ViewerToolbar.tsx", import.meta.url),
  "utf8",
);
const imageViewerSource = readFileSync(
  new URL("../ImageViewer.tsx", import.meta.url),
  "utf8",
);
const mermaidSource = readFileSync(
  new URL("../../chat/ChatMessage/MermaidDiagram.tsx", import.meta.url),
  "utf8",
);
const excalidrawSource = readFileSync(
  new URL("../../documents/previews/ExcalidrawPreview.tsx", import.meta.url),
  "utf8",
);

test("ViewerToolbar handles bottom safe-area through positioning, not padding", () => {
  assert.match(
    source,
    /bottom-\[calc\(1rem\+var\(--app-safe-area-bottom,0px\)\)\]/,
  );
  assert.doesNotMatch(source, /safe-area-bottom/);
});

test("ViewerToolbar call sites avoid safe-area padding that shifts controls off center", () => {
  for (const consumerSource of [
    imageViewerSource,
    mermaidSource,
    excalidrawSource,
  ]) {
    assert.doesNotMatch(
      consumerSource,
      /<ViewerToolbar[\s\S]*?className="safe-area-bottom"/,
    );
  }
});

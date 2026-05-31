import assert from "node:assert/strict";
import test from "node:test";

import {
  countProjectRevealFiles,
  shouldLoadProjectRevealFiles,
} from "../projectRevealState.ts";

test("counts text and binary reveal_project files together", () => {
  assert.equal(
    countProjectRevealFiles(
      {
        "/index.html": '<img src="/main.png">',
      },
      {
        "/main.png": "https://example.com/main.png",
        "/detail.png": "https://example.com/detail.png",
      },
    ),
    3,
  );
});

test("counts pure binary reveal_project folders", () => {
  assert.equal(
    countProjectRevealFiles(
      {},
      {
        "/main.png": "https://example.com/main.png",
        "/detail.png": "https://example.com/detail.png",
        "/flatlay.png": "https://example.com/flatlay.png",
      },
    ),
    3,
  );
});

test("loads versioned project files only when preview work is actually needed", () => {
  assert.equal(
    shouldLoadProjectRevealFiles({
      isVersionedProject: true,
      success: true,
      isPreviewOpen: false,
      allowAutoPreview: false,
    }),
    false,
  );

  assert.equal(
    shouldLoadProjectRevealFiles({
      isVersionedProject: true,
      success: true,
      isPreviewOpen: true,
      allowAutoPreview: false,
    }),
    true,
  );

  assert.equal(
    shouldLoadProjectRevealFiles({
      isVersionedProject: true,
      success: true,
      isPreviewOpen: false,
      allowAutoPreview: true,
    }),
    true,
  );
});

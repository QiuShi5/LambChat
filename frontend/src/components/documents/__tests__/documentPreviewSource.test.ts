import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../useDocumentPreviewState.ts", import.meta.url),
  "utf8",
);

test("DocumentPreview resolves signed URLs before loading from storage", () => {
  assert.match(source, /buildUploadProxyUrl/);
  assert.match(source, /buildUploadProxyUrlFromKey/);
  assert.match(source, /getFullUrl/);
  assert.match(
    source,
    /const resolvedSignedUrl = getFullUrl\(signedUrl\) \|\| signedUrl/,
  );
  assert.match(source, /setResolvedUrl\(url\)/);
  assert.doesNotMatch(source, /const url =\s+signedUrl \|\|/);
});

test("DocumentPreview fetches file content through the upload proxy", () => {
  assert.match(source, /const readUrl = buildUploadProxyUrl\(url\) \|\| url/);
  assert.match(source, /fetchDocumentArrayBuffer\(readUrl\)/);
  assert.match(source, /fetchDocumentText\(readUrl\)/);
});

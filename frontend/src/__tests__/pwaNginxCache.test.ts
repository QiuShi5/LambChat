import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const nginxSource = readFileSync(
  resolve(import.meta.dirname, "../../../nginx/nginx.conf"),
  "utf8",
);

test("nginx keeps service worker and manifest metadata fresh", () => {
  assert.match(nginxSource, /location = \/sw\.js \{[^}]*no-cache/s);
  assert.match(nginxSource, /location = \/manifest\.json \{[^}]*no-cache/s);
});

test("nginx serves stable icon assets with immutable long-lived caching", () => {
  assert.match(
    nginxSource,
    /location \/icons\/ \{[^}]*max-age=31536000, immutable/s,
  );
});

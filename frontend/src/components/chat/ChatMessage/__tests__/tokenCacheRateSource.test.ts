import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendSrc = resolve(currentDir, "../../../..");

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("token details popover computes cache rate on the frontend", () => {
  const source = readFileSync(resolve(currentDir, "../index.tsx"), "utf8");

  assert.match(source, /const cacheRate =/);
  assert.match(source, /cache_read_tokens/);
  assert.match(source, /input_tokens/);
  assert.match(source, /t\("chat\.message\.tokenCacheRate"\)/);
});

test("cache rate label is available in every locale", () => {
  for (const locale of ["en", "zh", "ja", "ko", "ru"]) {
    const messages = readJson(
      resolve(frontendSrc, "i18n", "locales", `${locale}.json`),
    ).chat.message;

    assert.equal(typeof messages.tokenCacheRate, "string");
    assert.notEqual(messages.tokenCacheRate.trim(), "");
  }
});

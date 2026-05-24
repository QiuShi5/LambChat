import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTeamCloneUrl,
  buildTeamCollectionUrl,
  buildTeamItemUrl,
  buildTeamPreferenceUrl,
} from "../team.ts";

test("buildTeamCollectionUrl uses the backend collection route", () => {
  assert.equal(buildTeamCollectionUrl(), "/api/teams/");
});

test("buildTeamCollectionUrl includes pagination params", () => {
  assert.equal(buildTeamCollectionUrl(10, 25), "/api/teams/?skip=10&limit=25");
});

test("buildTeamCollectionUrl includes filters", () => {
  assert.equal(
    buildTeamCollectionUrl({
      skip: 10,
      limit: 25,
      q: "research",
      tag: "analysis",
      pinned: true,
    }),
    "/api/teams/?skip=10&limit=25&q=research&tag=analysis&pinned=true",
  );
});

test("buildTeamItemUrl encodes team ids", () => {
  assert.equal(buildTeamItemUrl("team/1"), "/api/teams/team%2F1");
});

test("buildTeamCloneUrl encodes team ids", () => {
  assert.equal(buildTeamCloneUrl("team/1"), "/api/teams/team%2F1/clone");
});

test("buildTeamPreferenceUrl matches the backend preference route", () => {
  assert.equal(
    buildTeamPreferenceUrl("team/1"),
    "/api/teams/team%2F1/preference",
  );
});

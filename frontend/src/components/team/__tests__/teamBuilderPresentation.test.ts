import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const wrapperSource = readFileSync(
  new URL("../TeamBuilderWrapper.tsx", import.meta.url),
  "utf8",
);
const builderSource = readFileSync(
  new URL("../TeamBuilder.tsx", import.meta.url),
  "utf8",
);
const memberCardSource = readFileSync(
  new URL("../TeamMemberCard.tsx", import.meta.url),
  "utf8",
);
const teamCssUrl = new URL("../../../styles/team.css", import.meta.url);
const teamCss = existsSync(teamCssUrl) ? readFileSync(teamCssUrl, "utf8") : "";

function cssBlock(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return teamCss.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]*)\\}`))?.groups
    ?.body;
}

function assertCssDeclaration(
  selector: string,
  property: string,
  value: string,
) {
  assert.match(
    cssBlock(selector) ?? "",
    new RegExp(`${property}:\\s*${value};`),
    `${selector} should declare ${property}: ${value}`,
  );
}

test("team selected member cards fill the team member picker width", () => {
  assertCssDeclaration(".team-form-selected__list", "width", "100%");
  assertCssDeclaration(
    ".team-form-selected__list",
    "container-type",
    "inline-size",
  );
  assert.match(
    teamCss,
    /\.team-form-selected__list \.list-item-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;/,
  );
  assert.match(
    teamCss,
    /\.team-form-selected__list \.list-item-card\s*\{[\s\S]*?min-width:\s*0;/,
  );
});

test("team member cards adapt to narrow editor containers", () => {
  assert.match(teamCss, /@container \(max-width:\s*420px\)/);
  assert.match(
    teamCss,
    /@container \(max-width:\s*420px\) \{[\s\S]*?\.team-form-selected__list \.list-item-card__top\s*\{[\s\S]*?display:\s*grid;/,
  );
  assert.match(
    teamCss,
    /@container \(max-width:\s*420px\) \{[\s\S]*?grid-template-columns:\s*auto minmax\(0, 1fr\) auto auto;/,
  );
  assert.match(
    teamCss,
    /@container \(max-width:\s*420px\) \{[\s\S]*?\.team-form-selected__list \.list-item-card__identity\s*\{[\s\S]*?grid-column:\s*2 \/ -1;/,
  );
  assert.match(
    teamCss,
    /@container \(max-width:\s*420px\) \{[\s\S]*?\.team-form-selected__list \.list-item-card__actions\s*\{[\s\S]*?grid-row:\s*2;/,
  );
});

test("team toggle keeps the desktop switch dimensions", () => {
  assertCssDeclaration(".team-toggle", "width", "36px");
  assertCssDeclaration(".team-toggle", "height", "20px");
  assertCssDeclaration(".team-toggle", "min-height", "20px");
  assertCssDeclaration(".team-toggle", "min-width", "36px");
  assertCssDeclaration(".team-toggle::after", "width", "16px");
  assertCssDeclaration(".team-toggle::after", "height", "16px");
  assertCssDeclaration(
    ".team-toggle--on::after",
    "transform",
    "translateX\\(16px\\)",
  );
});

test("team builder list adopts shared panel and role-library presentation", () => {
  assert.match(wrapperSource, /<PanelHeader/);
  assert.match(wrapperSource, /<EditorSidebar/);
  assert.match(wrapperSource, /editorOpen/);
  assert.match(wrapperSource, /widthStorageKey="team-editor-sidebar-width"/);
  assert.match(wrapperSource, /skill-theme-shell flex h-full min-h-0 flex-col/);
  assert.match(wrapperSource, /skill-content-area flex-1 overflow-y-auto/);
  assert.match(wrapperSource, /TEAM_PAGE_SIZE/);
  assert.match(wrapperSource, /loadMoreRef/);
  assert.match(wrapperSource, /IntersectionObserver/);
  assert.match(wrapperSource, /className="team-card/);
  assert.match(wrapperSource, /TeamAvatar/);
  assert.match(wrapperSource, /getTeamFallbackAvatar/);
});

test("team builder relies on shared panel header mobile density", () => {
  assert.match(wrapperSource, /<PanelHeader/);
  assert.match(wrapperSource, /className="skill-panel-header"/);
  assert.doesNotMatch(wrapperSource, /isHeaderCompact/);
  assert.doesNotMatch(wrapperSource, /TEAM_HEADER_COMPACT_SCROLL_TOP/);
  assert.doesNotMatch(wrapperSource, /handleContentScroll/);
  assert.doesNotMatch(wrapperSource, /team-panel-header--compact/);
  assert.doesNotMatch(wrapperSource, /onScroll=\{handleContentScroll\}/);
});

test("team editor uses one sidebar form matching role editor patterns", () => {
  assert.match(builderSource, /className="es-form"/);
  assert.match(builderSource, /ppe-profile-section/);
  assert.match(builderSource, /tmb-header/);
  assert.match(builderSource, /team-role-picker-trigger/);
  assert.match(builderSource, /team-role-picker-dropdown__list/);
  assert.match(builderSource, /team-form-selected__list/);
  assert.match(wrapperSource, /footerState/);
  assert.match(wrapperSource, /<EditorSidebar/);
  assert.doesNotMatch(builderSource, /activeMobilePane/);
  assert.doesNotMatch(builderSource, /team-builder-mobile-switch/);
  assert.doesNotMatch(builderSource, /data-mobile-pane/);
  assert.doesNotMatch(builderSource, /team-editor-progress/);
  assert.match(memberCardSource, /list-item-card/);
  assert.match(memberCardSource, /team-member-card__avatar-btn/);
  assert.match(builderSource, /teamAvatar/);
  assert.match(builderSource, /ppe-icon-picker/);
  assert.match(builderSource, /persona-avatars/);
  assert.match(teamCss, /\.team-editor-form\s*\{/);
  assert.match(teamCss, /\.team-form-role-option\s*\{/);
  assert.match(teamCss, /\.team-form-selected__list\s*\{/);
  assert.match(
    teamCss,
    /\.team-form-selected__list \.list-item-card\s*\{[\s\S]*?width:\s*100%;/,
  );
  assert.match(teamCss, /\.team-role-picker-dropdown\s*\{/);
});

test("team editor defines dedicated tablet and mobile adaptations", () => {
  assert.match(teamCss, /@media \(max-width:\s*1180px\)/);
  assert.match(teamCss, /@media \(max-width:\s*760px\)/);
  assert.match(builderSource, /ppe-profile-section/);
  assert.match(teamCss, /\.tmb-header/);
  assert.match(
    teamCss,
    /@media \(max-width:\s*760px\) \{[\s\S]*?\.tmb-header\s*\{[\s\S]*?align-items:\s*stretch;/,
  );
  assert.match(
    teamCss,
    /@media \(max-width:\s*760px\) \{[\s\S]*?\.tmb-header__row\s*\{[\s\S]*?flex-wrap:\s*wrap;/,
  );
  assert.match(
    teamCss,
    /@media \(max-width:\s*760px\) \{[\s\S]*?\.team-editor-action-stack\s*\{[\s\S]*?min-width:\s*0;/,
  );
});

test("team styles allow long scrolling lists and compact mobile cards", () => {
  assert.match(teamCss, /\.team-load-sentinel/);
  assert.match(teamCss, /\.team-role-picker-dropdown__list/);
  assert.match(
    teamCss,
    /\.team-role-picker-dropdown__list\s*\{[\s\S]*?overflow-y:\s*auto;/,
  );
  assert.match(
    teamCss,
    /@media \(max-width:\s*639px\) \{[\s\S]*?\.team-form-role-list\s*\{[\s\S]*?max-height:\s*16rem;/,
  );
  assert.match(
    teamCss,
    /@media \(max-width:\s*639px\) \{[\s\S]*?\.list-item-card__top\s*\{[\s\S]*?flex-wrap:\s*wrap;/,
  );
});

test("team avatar image containers constrain absolute avatar images", () => {
  for (const selector of [
    ".team-avatar",
    ".team-picker-avatar",
    ".team-toolbar-avatar",
  ]) {
    assertCssDeclaration(selector, "position", "relative");
    assertCssDeclaration(selector, "overflow", "hidden");
    assertCssDeclaration(selector, "flex-shrink", "0");
  }
  for (const selector of [".team-picker-avatar", ".team-toolbar-avatar"]) {
    assert.match(
      teamCss,
      new RegExp(
        `${selector.replace(
          ".",
          "\\.",
        )} \\.scb__avatar-img\\s*,|,\\s*${selector.replace(
          ".",
          "\\.",
        )} \\.scb__avatar-img`,
      ),
      `${selector} avatar images should receive explicit image sizing rules`,
    );
  }
  assertCssDeclaration(".team-picker-avatar", "width", "2\\.5rem");
  assertCssDeclaration(".team-picker-avatar", "height", "2\\.5rem");
  assertCssDeclaration(".team-toolbar-avatar", "width", "1\\.125rem");
  assertCssDeclaration(".team-toolbar-avatar", "height", "1\\.125rem");
});

test("team member card exposes collapsible sandbox and model controls", () => {
  assert.doesNotMatch(memberCardSource, /availableAgents/);
  assert.doesNotMatch(memberCardSource, /onAgentModeChange/);
  assert.doesNotMatch(memberCardSource, /agentModeValue/);
  assert.match(memberCardSource, /onSandboxChange/);
  assert.match(memberCardSource, /memberSandbox/);
  assert.match(memberCardSource, /team-member-card__field--sandbox/);
  assert.match(memberCardSource, /member\.sandbox_enabled/);
  assert.match(memberCardSource, /availableModels/);
  assert.match(memberCardSource, /onModelChange/);
  assert.match(memberCardSource, /team-member-card__model/);
  assert.match(memberCardSource, /followSessionModel/);
  assert.match(memberCardSource, /<Select/);
  assert.match(memberCardSource, /value=\{member\.model_id \?\? ""\}/);
  assert.match(memberCardSource, /onChange=\{\(v\) => onModelChange\?\.\(v \|\| null\)\}/);
  assert.match(teamCss, /\.team-member-card__model\s*\{/);
  assertCssDeclaration(
    ".team-member-card__field--sandbox",
    "flex-direction",
    "row",
  );
  assertCssDeclaration(
    ".team-member-card__field--sandbox",
    "align-items",
    "center",
  );
  assert.match(
    teamCss,
    /\.team-member-card__model span\s*\{[\s\S]*?text-overflow:\s*ellipsis;/,
  );
});

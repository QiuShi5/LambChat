import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const filterSource = readFileSync(
  new URL("../MemoryFilter.tsx", import.meta.url),
  "utf8",
);
const componentsCss = readFileSync(
  new URL("../../../../styles/components.css", import.meta.url),
  "utf8",
);
const skillsListSource = readFileSync(
  new URL("../../SkillsPanel/SkillsList.tsx", import.meta.url),
  "utf8",
);
const marketplaceSource = readFileSync(
  new URL("../../MarketplacePanel.tsx", import.meta.url),
  "utf8",
);
const skillFilterDropdownSource = readFileSync(
  new URL("../../SkillFilterDropdown.tsx", import.meta.url),
  "utf8",
);
const panelControlsSource = readFileSync(
  new URL("../../../common/PanelControls.tsx", import.meta.url),
  "utf8",
);

test("memory filter trigger uses shared stable panel filter sizing", () => {
  assert.match(filterSource, /data-filter-menu/);
  assert.doesNotMatch(filterSource, /className="panel-search[^"]*h-10/);
  assert.match(filterSource, /import \{ PanelFilterSelect \}/);
  assert.match(
    filterSource,
    /<PanelFilterSelect[\s\S]*onChange=\{typeOnChange\}/,
  );
  assert.match(
    filterSource,
    /<PanelFilterSelect[\s\S]*onChange=\{sourceOnChange\}/,
  );
  assert.match(filterSource, /panel-filter-trigger/);
  assert.match(filterSource, /panel-filter-trigger__label/);
  assert.doesNotMatch(filterSource, /<Button[\s\S]*panel-filter-trigger/);
  assert.doesNotMatch(filterSource, /import \{ Select \}/);

  assert.match(
    componentsCss,
    /\.panel-filter-select\s*\{[\s\S]*?min-width:\s*min\(10rem,\s*42vw\);[\s\S]*?max-width:\s*min\(13rem,\s*42vw\);/,
  );
  assert.match(
    componentsCss,
    /\.panel-filter-trigger\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?justify-content:\s*space-between;/,
  );
  assert.match(
    componentsCss,
    /\.panel-filter-trigger__label\s*\{[\s\S]*?flex:\s*1 1 auto;[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;/,
  );
  assert.match(
    componentsCss,
    /\.panel-filter-trigger \.ui-button__label\s*\{[\s\S]*?display:\s*flex;[\s\S]*?width:\s*100%;/,
  );
  assert.match(
    componentsCss,
    /\.panel-filter-trigger \.ui-button__label > svg:last-child\s*\{[\s\S]*?margin-left:\s*auto;/,
  );
  assert.match(
    componentsCss,
    /\.ui-select-dropdown,\s*[\s\S]*?\.glass-select-dropdown\s*\{[\s\S]*?max-height:\s*14rem;[\s\S]*?overflow-y:\s*auto;/,
  );
  assert.match(
    componentsCss,
    /\.panel-header__mobile-menu-accessory \[data-filter-menu\] \.panel-filter-trigger\s*\{[\s\S]*?max-width:\s*none;/,
  );
});

test("tag filter dropdowns opt into stable mobile filter-menu behavior", () => {
  assert.match(panelControlsSource, /data-filter-menu/);
  assert.match(panelControlsSource, /panel-filter-menu/);
  assert.match(skillsListSource, /SkillFilterDropdown/);
  assert.doesNotMatch(skillsListSource, /<FilterDropdown/);
  assert.match(marketplaceSource, /SkillFilterDropdown/);
  assert.doesNotMatch(marketplaceSource, /<FilterDropdown/);
  assert.match(skillFilterDropdownSource, /data-panel-header-dropdown/);
  assert.match(
    skillFilterDropdownSource,
    /className="fixed inset-0 z-\[999\]"/,
  );
  assert.match(
    skillFilterDropdownSource,
    /skill-filter-dropdown panel-header-dropdown/,
  );
  assert.match(skillFilterDropdownSource, /role="menu"/);
  assert.match(skillFilterDropdownSource, /getDropdownPosition/);
  assert.match(skillFilterDropdownSource, /window\.visualViewport/);
  assert.match(skillFilterDropdownSource, /skill-filter-segment/);
  assert.match(skillFilterDropdownSource, /skill-tag-chip/);
  assert.match(skillFilterDropdownSource, /aria-haspopup="menu"/);
  assert.match(skillFilterDropdownSource, /aria-expanded=\{isOpen\}/);
  assert.match(
    skillFilterDropdownSource,
    /aria-pressed=\{selectedTags\.includes\(tag\)\}/,
  );
});

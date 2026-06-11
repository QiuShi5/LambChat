# Frontend Component Reuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reusable frontend selector components and a shared body scroll lock hook while preserving existing props, behavior, class names, and visual styling.

**Architecture:** Keep the first implementation pass local to `frontend/src/components/selectors` and `frontend/src/hooks`. Extract presentational wrappers from `SkillSelector`, `ToolSelector`, and `AgentModeSelector` without changing list item markup or business callbacks. Use source-level tests to prove that stable class names and imports moved into shared components rather than disappearing.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS class strings, Node test runner via `tsx --test`.

---

## File Structure

- Create: `frontend/src/hooks/useBodyScrollLock.ts`
  - Restores the previous `document.body.style.overflow` value after unlock or unmount.
- Create: `frontend/src/hooks/__tests__/useBodyScrollLock.test.ts`
  - Verifies lock/unlock behavior with real React rendering.
- Create: `frontend/src/components/selectors/SelectorModalShell.tsx`
  - Shared selector modal container with exact existing class names and background style.
- Create: `frontend/src/components/selectors/SelectorModalHeader.tsx`
  - Shared selector modal header with exact existing drag handle, icon tile, title, subtitle, close button, and border style.
- Create: `frontend/src/components/selectors/SelectorActionBar.tsx`
  - Shared selector action-row container and action button class names.
- Modify: `frontend/src/components/selectors/SkillSelector.tsx`
  - Replace duplicated modal shell, header, action bar, and body scroll lock code.
- Modify: `frontend/src/components/selectors/ToolSelector.tsx`
  - Replace duplicated modal shell, header, action bar, and body scroll lock code.
- Modify: `frontend/src/components/selectors/AgentModeSelector.tsx`
  - Replace duplicated modal shell/header and body scroll lock code.
- Modify: `frontend/src/components/selectors/__tests__/selectorModalSource.test.ts`
  - Add source checks for the shared selector components and updated consumers.
- Modify: `docs/frontend/ui-components.md`
  - Document selector-modal shared components after extraction.

## Task 1: Shared Body Scroll Lock Hook

- [ ] **Step 1: Write the failing test**

Add `frontend/src/hooks/__tests__/useBodyScrollLock.test.ts` with a small React component that toggles `useBodyScrollLock`.

Expected assertions:

- Locking sets `document.body.style.overflow` to `"hidden"`.
- Unlocking restores the previous value.
- Unmounting while locked restores the previous value.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend
pnpm exec tsx --test src/hooks/__tests__/useBodyScrollLock.test.ts
```

Expected: FAIL because `useBodyScrollLock` does not exist.

- [ ] **Step 3: Implement the hook**

Use `useEffect`; if `locked` is false, do nothing. When locked, store the current overflow and restore it in cleanup.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd frontend
pnpm exec tsx --test src/hooks/__tests__/useBodyScrollLock.test.ts
```

Expected: PASS.

## Task 2: Shared Selector Shell/Header/Action Source Tests

- [ ] **Step 1: Extend source tests first**

Update `frontend/src/components/selectors/__tests__/selectorModalSource.test.ts` to assert:

- `SelectorModalShell.tsx` contains the exact existing modal class string.
- `SelectorModalShell.tsx` contains `background: "var(--theme-bg-card)"`.
- `SelectorModalHeader.tsx` contains the exact existing header class string and mobile drag-handle class string.
- `SelectorActionBar.tsx` contains the exact existing action row class string and text action button class string.
- `SkillSelector.tsx`, `ToolSelector.tsx`, and `AgentModeSelector.tsx` import `SelectorModalShell`.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend
pnpm exec tsx --test src/components/selectors/__tests__/selectorModalSource.test.ts
```

Expected: FAIL because the shared files do not exist and consumers do not import them.

## Task 3: Extract Shared Selector Components

- [ ] **Step 1: Create shared selector files**

Create the three selector shared files using the exact class strings from current selector markup.

- [ ] **Step 2: Replace modal shell usage**

Update `SkillSelector`, `ToolSelector`, and `AgentModeSelector`:

- Remove duplicated modal container markup.
- Wrap modal contents with `SelectorModalShell`.
- Preserve the same `ref`, `onClick`, style, and children structure.

- [ ] **Step 3: Replace header usage**

Update:

- `SkillSelector` header with `SelectorModalHeader`.
- `ToolSelector` header with `SelectorModalHeader`.
- `AgentModeSelector` header with `SelectorModalHeader`, preserving its `relative` header class behavior if needed through a prop.

- [ ] **Step 4: Replace action bar usage**

Update:

- `SkillSelector` action row with `SelectorActionBar` and `SelectorActionButton`.
- `ToolSelector` action row with `SelectorActionBar` and `SelectorActionButton`.

Do not change the business callbacks, disabled conditions, toast logic, or navigation behavior.

- [ ] **Step 5: Replace selector scroll-lock effects**

Use `useBodyScrollLock(isOpen)` or `useBodyScrollLock(open)` in the selector files and remove duplicated body overflow effects.

- [ ] **Step 6: Run source tests**

```bash
cd frontend
pnpm exec tsx --test src/components/selectors/__tests__/selectorModalSource.test.ts
```

Expected: PASS.

## Task 4: Documentation and Verification

- [ ] **Step 1: Update UI component docs**

Add a short section to `docs/frontend/ui-components.md` documenting selector-local shared components and clarifying that they are not generic `common` primitives.

- [ ] **Step 2: Run targeted selector tests**

```bash
cd frontend
pnpm exec tsx --test src/components/selectors/__tests__/*.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run hook test**

```bash
cd frontend
pnpm exec tsx --test src/hooks/__tests__/useBodyScrollLock.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run frontend build**

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Review diff for style drift**

Compare moved class strings against the previous inline markup. The shared components should own the same classes, and selector item rows should remain unchanged.

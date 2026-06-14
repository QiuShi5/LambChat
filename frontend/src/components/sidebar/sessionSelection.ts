export function toggleSessionSelection(
  selectedIds: Set<string>,
  sessionId: string,
): Set<string> {
  const next = new Set(selectedIds);
  if (next.has(sessionId)) {
    next.delete(sessionId);
  } else {
    next.add(sessionId);
  }
  return next;
}

export function isEveryVisibleSessionSelected(
  selectedIds: Set<string>,
  visibleSessionIds: string[],
): boolean {
  return (
    visibleSessionIds.length > 0 &&
    visibleSessionIds.every((sessionId) => selectedIds.has(sessionId))
  );
}

export function toggleAllVisibleSessions(
  selectedIds: Set<string>,
  visibleSessionIds: string[],
): Set<string> {
  const next = new Set(selectedIds);
  const shouldClear = isEveryVisibleSessionSelected(next, visibleSessionIds);

  for (const sessionId of visibleSessionIds) {
    if (shouldClear) {
      next.delete(sessionId);
    } else {
      next.add(sessionId);
    }
  }

  return next;
}

export function clearMissingSelections(
  selectedIds: Set<string>,
  loadedSessionIds: string[],
): Set<string> {
  const loaded = new Set(loadedSessionIds);
  return new Set(Array.from(selectedIds).filter((id) => loaded.has(id)));
}

import { useCallback, useMemo, useState } from 'react';
import type { Diff, DiffChangeKind } from 'shared/types';

type DiffCollapseDefaults = Record<DiffChangeKind, boolean>;

const DEFAULT_DIFF_COLLAPSE_DEFAULTS: DiffCollapseDefaults = {
  added: false,
  deleted: true,
  modified: false,
  renamed: true,
  copied: true,
  permissionChange: true,
};

const DEFAULT_COLLAPSE_MAX_LINES = 200;
const DEFAULT_COLLAPSE_ALL_THRESHOLD = 50;

const exceedsMaxLineCount = (diff: Diff, maxLines: number) => {
  if (diff.additions != null || diff.deletions != null) {
    return (diff.additions ?? 0) + (diff.deletions ?? 0) > maxLines;
  }

  return true;
};

export const getDiffId = (diff: Diff, index: number) =>
  diff.newPath || diff.oldPath || String(index);

interface UseDiffCollapseStateOptions {
  collapseDefaults?: DiffCollapseDefaults;
  maxLines?: number;
  collapseAllThreshold?: number;
}

export function useDiffCollapseState(
  diffs: Diff[],
  options: UseDiffCollapseStateOptions = {}
) {
  const {
    collapseDefaults = DEFAULT_DIFF_COLLAPSE_DEFAULTS,
    maxLines = DEFAULT_COLLAPSE_MAX_LINES,
    collapseAllThreshold = DEFAULT_COLLAPSE_ALL_THRESHOLD,
  } = options;

  const [userCollapseOverrides, setUserCollapseOverrides] = useState<
    Map<string, boolean>
  >(() => new Map());

  const defaultCollapsedIds = useMemo(() => {
    const collapsed = new Set<string>();

    const fileCountExceedsCollapseThreshold =
      collapseAllThreshold != null &&
      collapseAllThreshold > 0 &&
      diffs.length > collapseAllThreshold;

    diffs.forEach((diff, index) => {
      const shouldCollapse =
        fileCountExceedsCollapseThreshold ||
        collapseDefaults[diff.change] ||
        (maxLines && maxLines > 0 && exceedsMaxLineCount(diff, maxLines));

      if (shouldCollapse) {
        collapsed.add(getDiffId(diff, index));
      }
    });

    return collapsed;
  }, [diffs, collapseDefaults, maxLines, collapseAllThreshold]);

  const toggle = useCallback(
    (id: string) => {
      setUserCollapseOverrides((prev) => {
        const next = new Map(prev);
        const isCurrentlyCollapsed = prev.has(id)
          ? prev.get(id)!
          : defaultCollapsedIds.has(id);
        next.set(id, !isCurrentlyCollapsed);
        return next;
      });
    },
    [defaultCollapsedIds]
  );

  const setAllCollapsed = useCallback(
    (collapsed: boolean) => {
      setUserCollapseOverrides(() => {
        const next = new Map<string, boolean>();
        diffs.forEach((diff, index) =>
          next.set(getDiffId(diff, index), collapsed)
        );
        return next;
      });
    },
    [diffs]
  );

  const collapseAll = useCallback(
    () => setAllCollapsed(true),
    [setAllCollapsed]
  );
  const expandAll = useCallback(
    () => setAllCollapsed(false),
    [setAllCollapsed]
  );

  const collapsedIds = useMemo(() => {
    const collapsed = new Set<string>();
    diffs.forEach((diff, index) => {
      const id = getDiffId(diff, index);

      const isCollapsed = userCollapseOverrides.has(id)
        ? userCollapseOverrides.get(id)!
        : defaultCollapsedIds.has(id);

      if (isCollapsed) {
        collapsed.add(id);
      }
    });
    return collapsed;
  }, [diffs, userCollapseOverrides, defaultCollapsedIds]);

  const allCollapsed = useMemo(() => {
    return diffs.length > 0 && collapsedIds.size === diffs.length;
  }, [diffs.length, collapsedIds.size]);

  return {
    toggle,
    collapseAll,
    expandAll,
    allCollapsed,
    collapsedIds,
  };
}

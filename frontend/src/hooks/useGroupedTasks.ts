/**
 * useGroupedTasks — manages grouped task state & per-group pagination.
 *
 * When `groupBy !== "none"` this hook calls GET /tasks/grouped and returns:
 *  - `groupMap`  — Map<groupKey, GroupState>  (source of truth for the UI)
 *  - `isLoading` — true while the initial load is in-flight
 *  - `loadGroups()` — trigger a full reload (call when filters change)
 *  - `goToGroupPage(key, page)` — navigate to a specific page within one group
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { taskApi } from "@/utils/api/taskApi";
import type { GroupState } from "@/types/tasks";

export interface UseGroupedTasksOptions {
  organizationId: string | null | undefined;
  groupBy: string;
  /** Per-group page size — default 50 */
  limitPerGroup?: number;
  /** All filter params to forward to the backend */
  filters?: {
    workspaceId?: string;
    projectId?: string;
    sprintId?: string;
    priorities?: string;
    statuses?: string;
    types?: string;
    assigneeIds?: string;
    reporterIds?: string;
    search?: string;
  };
}

export function useGroupedTasks({
  organizationId,
  groupBy,
  limitPerGroup = 50,
  filters = {},
}: UseGroupedTasksOptions) {
  const [groupMap, setGroupMap] = useState<Map<string, GroupState>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isGrouped = groupBy !== "none";

  const loadGroups = useCallback(async () => {
    if (!organizationId || !isGrouped) {
      setGroupMap(new Map());
      return;
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await taskApi.getGroupedTasks(organizationId, groupBy, {
        ...filters,
        limitPerGroup,
      });

      const limit = res.limitPerGroup ?? limitPerGroup;
      const newMap = new Map<string, GroupState>();
      for (const g of res.groups) {
        const totalPages = Math.max(1, Math.ceil(g.totalCount / limit));
        newMap.set(g.key, {
          key: g.key,
          label: g.label,
          tasks: g.tasks,
          totalCount: g.totalCount,
          page: 1,
          totalPages,
          loadingMore: false,
        });
      }
      setGroupMap(newMap);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("[useGroupedTasks] loadGroups error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, groupBy, isGrouped, limitPerGroup, JSON.stringify(filters)]);


  /** Navigate to a specific page for a single group (replaces tasks — not appends). */
  const goToGroupPage = useCallback(
    async (groupKey: string, targetPage: number) => {
      if (!organizationId || !isGrouped) return;
      const existing = groupMap.get(groupKey);
      if (!existing || existing.loadingMore) return;

      // Optimistic: mark as loading
      setGroupMap((prev) => {
        const next = new Map(prev);
        const entry = next.get(groupKey);
        if (entry) next.set(groupKey, { ...entry, loadingMore: true });
        return next;
      });

      try {
        const res = await taskApi.getGroupedTasks(organizationId, groupBy, {
          ...filters,
          limitPerGroup,
          groupKey,
          page: targetPage,
        });

        const fresh = res.groups[0];
        if (!fresh) return;

        const limit = res.limitPerGroup ?? limitPerGroup;
        const totalPages = Math.max(1, Math.ceil(fresh.totalCount / limit));

        setGroupMap((prev) => {
          const next = new Map(prev);
          const entry = next.get(groupKey);
          if (!entry) return next;
          next.set(groupKey, {
            ...entry,
            tasks: fresh.tasks,
            totalCount: fresh.totalCount,
            page: targetPage,
            totalPages,
            loadingMore: false,
          });
          return next;
        });
      } catch (err) {
        console.error(`[useGroupedTasks] goToGroupPage error for "${groupKey}":`, err);
        setGroupMap((prev) => {
          const next = new Map(prev);
          const entry = next.get(groupKey);
          if (entry) next.set(groupKey, { ...entry, loadingMore: false });
          return next;
        });
      }
    },
    [organizationId, groupBy, isGrouped, groupMap, limitPerGroup, JSON.stringify(filters)]

  );

  /** Re-load whenever org / groupBy / filters change */
  useEffect(() => {
    if (isGrouped && organizationId) {
      loadGroups();
    } else {
      setGroupMap(new Map());
    }
  }, [organizationId, groupBy, JSON.stringify(filters), limitPerGroup]);


  return { groupMap, isLoading, loadGroups, goToGroupPage };
}

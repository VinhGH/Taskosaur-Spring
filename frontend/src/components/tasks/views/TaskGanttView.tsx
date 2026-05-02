import { useState, useEffect, useRef, useMemo, useCallback, type KeyboardEvent, memo } from "react";
import { formatDateForDisplay } from "@/utils/date";
import { useRouter } from "next/router";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Task, TaskGanttViewProps, TimeRange, ViewMode, GroupByField } from "@/types";
import { TaskInfoPanel } from "@/components/gantt/TaskInfoPanel";
import { getViewModeWidth, parseDate } from "@/utils/gantt";
import { TaskBar } from "@/components/gantt/TaskBar";
import { TimelineHeader } from "@/components/gantt/TimelineHeader";
import { GanttGrid } from "@/components/gantt/GanttGrid";
import TaskTableSkeleton from "@/components/skeletons/TaskTableSkeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { taskApi } from "@/utils/api/taskApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const MINIMUM_ROWS = 9;
const SCROLL_BUFFER = 5;

function sanitizeSlug(slug: string | undefined): string | undefined {
  return slug && /^[a-zA-Z0-9\-]+$/.test(slug) ? slug : undefined;
}

// ---------------------------------------------------------------------------
// Grouping helpers (mirrors TaskTable groupTasks, no color)
// ---------------------------------------------------------------------------

interface GanttGroup {
  key: string;
  label: string;
  tasks: Task[];
}

const PRIORITY_ORDER: Record<string, number> = {
  HIGHEST: 0, HIGH: 1, MEDIUM: 2, LOW: 3, LOWEST: 4, URGENT: 5,
};
const PRIORITY_LABELS: Record<string, string> = {
  HIGHEST: "Highest", HIGH: "High", MEDIUM: "Medium",
  LOW: "Low", LOWEST: "Lowest", URGENT: "Urgent",
};
const TYPE_LABELS: Record<string, string> = {
  TASK: "Task", BUG: "Bug", EPIC: "Epic", STORY: "Story", SUBTASK: "Sub-task",
};

function formatGroupDate(date: string | Date | null | undefined): { key: string; label: string } {
  if (!date) return { key: "no-date", label: "No Date" };
  const d = dayjs(date);
  if (!d.isValid()) return { key: "no-date", label: "No Date" };
  return { key: d.format("YYYY-MM-DD"), label: d.format("MMM DD, YYYY") };
}

function groupTasks(tasks: Task[], field: GroupByField): GanttGroup[] {
  if (field === "none") return [];

  const map = new Map<string, GanttGroup>();

  tasks.forEach((task) => {
    let key: string;
    let label: string;

    switch (field) {
      case "status": {
        const s = task.status as any;
        key = s?.id ?? "no-status";
        label = s?.name ?? "No Status";
        break;
      }
      case "priority":
        key = task.priority ?? "MEDIUM";
        label = PRIORITY_LABELS[key] ?? key;
        break;
      case "project":
        key = task.projectId ?? "no-project";
        label = (task.project as any)?.name ?? "No Project";
        break;
      case "assignee": {
        const a = task.assignees?.[0] ?? task.assignee;
        if (a) {
          key = (a as any).id;
          label = `${(a as any).firstName ?? ""} ${(a as any).lastName ?? ""}`.trim();
        } else {
          key = "unassigned"; label = "Unassigned";
        }
        break;
      }
      case "type":
        key = task.type ?? "TASK";
        label = TYPE_LABELS[key] ?? key;
        break;
      case "dueDate": {
        const { key: dk, label: dl } = formatGroupDate(task.dueDate);
        key = dk; label = dk === "no-date" ? "No Due Date" : dl;
        break;
      }
      case "createdAt": {
        const { key: ck, label: cl } = formatGroupDate((task as any).createdAt);
        key = ck; label = ck === "no-date" ? "No Created Date" : cl;
        break;
      }
      default:
        key = "other"; label = "Other";
    }

    if (!map.has(key)) map.set(key, { key, label, tasks: [] });
    map.get(key)!.tasks.push(task);
  });

  const groups = Array.from(map.values());

  if (field === "priority") {
    groups.sort((a, b) => (PRIORITY_ORDER[a.key] ?? 99) - (PRIORITY_ORDER[b.key] ?? 99));
  } else if (field === "dueDate" || field === "createdAt") {
    groups.sort((a, b) => {
      if (a.key === "no-date") return 1;
      if (b.key === "no-date") return -1;
      return a.key.localeCompare(b.key);
    });
  } else {
    groups.sort((a, b) => a.label.localeCompare(b.label));
  }

  return groups;
}

// ---------------------------------------------------------------------------
// SortableTaskRow
// ---------------------------------------------------------------------------
const SortableTaskRow = memo(({
  task, isCompact, isOverdue, isHovered, isFocused,
  safeWorkspaceSlug, safeProjectSlug, timeRange, viewMode,
  onHover, onFocus, onKeyDown, onTaskUpdate, taskRef,
}: {
  task: Task; isCompact: boolean; isOverdue: boolean; isHovered: boolean; isFocused: boolean;
  safeWorkspaceSlug?: string; safeProjectSlug?: string; timeRange: TimeRange; viewMode: ViewMode;
  onHover: (id: string | null) => void; onFocus: (id: string | null) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  taskRef: (el: HTMLDivElement | null) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div
      ref={(el) => { setNodeRef(el); taskRef(el); }}
      style={style}
      className={`flex items-center border-b border-[var(--border)] hover:bg-[var(--accent)] focus-within:bg-[var(--accent)]
           ${isHovered ? "bg-[var(--accent)] " : ""} ${isFocused ? "bg-[var(--accent)] ring-2 ring-[var(--ring)] ring-offset-2" : ""}
           ${isOverdue ? "bg-red-50 dark:bg-red-900/10 " : ""} ${isDragging ? "shadow-lg rounded-md" : ""}`}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => onKeyDown(e, task)}
      tabIndex={0}
      role="row"
    >
      <TaskInfoPanel
        task={task} isCompact={isCompact} isOverdue={isOverdue}
        workspaceSlug={safeWorkspaceSlug || ""} projectSlug={safeProjectSlug}
        onFocus={onFocus} dragAttributes={attributes} dragListeners={listeners}
      />
      <TaskBar
        task={task} timeRange={timeRange} viewMode={viewMode}
        isCompact={isCompact} isHovered={isHovered} isFocused={isFocused}
        workspaceSlug={safeWorkspaceSlug || ""} projectSlug={safeProjectSlug}
        onHover={onHover} onFocus={onFocus} onKeyDown={onKeyDown} onTaskUpdate={onTaskUpdate}
      />
    </div>
  );
});
SortableTaskRow.displayName = "SortableTaskRow";

// ---------------------------------------------------------------------------
// Group header row — spans both info-panel and timeline
// ---------------------------------------------------------------------------
const GanttGroupHeader = memo(({
  label, taskCount, isCompact, infoPanelWidth, expanded, onToggle,
}: {
  label: string; taskCount: number; isCompact: boolean;
  infoPanelWidth: number; expanded: boolean; onToggle: () => void;
}) => (
  <div
    className="flex items-center border-b border-[var(--border)] bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 transition-colors cursor-pointer select-none"
    onClick={onToggle}
    role="rowgroup"
  >
    {/* Sticky label section — same width as info panel */}
    <div
      className={`${isCompact ? "w-48" : "w-80"} px-4 border-r border-[var(--border)] bg-[var(--accent)]/30 shrink-0 sticky left-0 z-[999999] py-2.5 flex items-center gap-2`}
      style={{ minWidth: infoPanelWidth }}
    >
      <span className="text-[var(--muted-foreground)]">
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </span>
      <span className="text-xs font-semibold text-[var(--foreground)] tracking-wide uppercase truncate">
        {label}
      </span>
      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--border)]/60 text-[10px] font-medium text-[var(--muted-foreground)] shrink-0">
        {taskCount}
      </span>
    </div>
    {/* Empty timeline area — fills the rest */}
    <div className="flex-1 h-9" />
  </div>
));
GanttGroupHeader.displayName = "GanttGroupHeader";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TaskGanttView({
  tasks,
  workspaceSlug,
  projectSlug,
  viewMode: externalViewMode,
  onViewModeChange,
  onTaskUpdate,
  onTaskRefetch,
  workspaceId,
  organizationId,
  currentProject,
  groupBy = "none",
}: TaskGanttViewProps) {
  const router = useRouter();

  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: new Date(), end: new Date(), days: [] });
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Collapsed group keys
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("days");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 20 });

  const cellWidth = getViewModeWidth(viewMode);
  const infoPanelWidth = isCompact ? 192 : 320;

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const relativeScrollLeft = Math.max(0, scrollLeft - infoPanelWidth);
      const startIndex = Math.max(0, Math.floor(relativeScrollLeft / cellWidth) - SCROLL_BUFFER);
      const endIndex = Math.min(
        timeRange.days.length - 1,
        Math.ceil((relativeScrollLeft + clientWidth) / cellWidth) + SCROLL_BUFFER
      );
      setVisibleRange(prev => {
        if (prev.startIndex === startIndex && prev.endIndex === endIndex) return prev;
        return { startIndex, endIndex };
      });
    }
  }, [cellWidth, timeRange.days.length, infoPanelWidth]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [handleScroll]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const safeWorkspaceSlug = sanitizeSlug(workspaceSlug);
  const safeProjectSlug = sanitizeSlug(projectSlug);
  const safeTasks = tasks || [];

  const generateTimeScale = useCallback((start: Date, end: Date, mode: ViewMode) => {
    const scale: Date[] = [];
    const current = new Date(start);
    try {
      switch (mode) {
        case "days":
          while (current <= end && scale.length < 2000) {
            scale.push(new Date(current)); current.setDate(current.getDate() + 1);
          }
          break;
        case "weeks":
          current.setDate(current.getDate() - current.getDay());
          while (current <= end && scale.length < 500) {
            scale.push(new Date(current)); current.setDate(current.getDate() + 7);
          }
          break;
        case "months":
          current.setDate(1);
          while (current <= end && scale.length < 200) {
            scale.push(new Date(current)); current.setMonth(current.getMonth() + 1);
          }
          break;
      }
    } catch { return [new Date()]; }
    return scale;
  }, []);

  useEffect(() => {
    const processData = async () => {
      try {
        setIsLoading(true);
        const processedTasks = safeTasks.map((task, index) => {
          let startDate = task.startDate;
          let dueDate = task.dueDate;
          if (!startDate && !dueDate) {
            const base = task.createdAt ? parseDate(task.createdAt) : new Date();
            startDate = new Date(base.getTime() + index * 86400000).toISOString();
            dueDate = new Date(base.getTime() + (index + 7) * 86400000).toISOString();
          } else if (!startDate && dueDate) {
            const due = parseDate(dueDate);
            startDate = new Date(due.getTime() - 7 * 86400000).toISOString();
          } else if (startDate && !dueDate) {
            const start = parseDate(startDate);
            dueDate = new Date(start.getTime() + 7 * 86400000).toISOString();
          }
          return { ...task, startDate, dueDate };
        });

        let earliest = new Date(), latest = new Date();
        if (processedTasks.length > 0) {
          const allDates = processedTasks.flatMap(t => [parseDate(t.startDate), parseDate(t.dueDate)]);
          earliest = new Date(Math.min(...allDates.map(d => d.getTime())));
          latest = new Date(Math.max(...allDates.map(d => d.getTime())));
          earliest.setDate(earliest.getDate() - 5);
          latest.setDate(latest.getDate() + 10);
        }

        const days = generateTimeScale(earliest, latest, viewMode);
        setGanttTasks(processedTasks);
        setTimeRange({ start: earliest, end: latest, days });
        setError(null);
      } catch (err) {
        console.error("Error processing Gantt tasks:", err);
        setError("Failed to process tasks");
      } finally {
        setIsLoading(false);
      }
    };
    processData();
  }, [safeTasks, viewMode, generateTimeScale]);

  // Computed groups (memoised)
  const isGrouped = groupBy !== "none";
  const ganttGroups = useMemo(() => groupTasks(ganttTasks, groupBy), [ganttTasks, groupBy]);

  // Flat task list for non-grouped DnD
  const taskIds = useMemo(() => ganttTasks.map(t => t.id), [ganttTasks]);

  // Toggle a group open/closed
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // Shared rank-persistence helper
  const persistRank = useCallback(async (
    activeId: string,
    reorderedTasks: Task[],
    newIndex: number
  ) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let scopeType: "PROJECT" | "WORKSPACE" | "ORGANIZATION" = "ORGANIZATION";
    let scopeId = "";

    const activeTask = reorderedTasks.find(t => t.id === activeId)!;
    if (currentProject?.id) { scopeType = "PROJECT"; scopeId = currentProject.id; }
    else if (workspaceId) { scopeType = "WORKSPACE"; scopeId = workspaceId; }
    else if (organizationId) { scopeType = "ORGANIZATION"; scopeId = organizationId; }

    if ((!scopeId || !uuidRegex.test(scopeId)) && activeTask?.projectId) {
      scopeType = "PROJECT"; scopeId = activeTask.projectId;
    }
    if (!scopeId || !uuidRegex.test(scopeId)) {
      console.warn("Invalid scopeId for Gantt reorder — aborted."); return false;
    }

    const afterTask = newIndex > 0 ? reorderedTasks[newIndex - 1] : null;
    const beforeTask = newIndex < reorderedTasks.length - 1 ? reorderedTasks[newIndex + 1] : null;

    await taskApi.updateRelativeTaskRank(activeId, {
      scopeType, scopeId, viewType: "GANTT",
      afterTaskId: afterTask?.id, beforeTaskId: beforeTask?.id,
    });
    return true;
  }, [currentProject, workspaceId, organizationId]);

  // Flat drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ganttTasks.findIndex(t => t.id === active.id);
    const newIndex = ganttTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(ganttTasks, oldIndex, newIndex);
    setGanttTasks(reordered);
    try {
      await persistRank(active.id as string, reordered, newIndex);
      if (onTaskRefetch) onTaskRefetch();
    } catch (err) {
      console.error("Gantt task reorder failed:", err);
      setGanttTasks(ganttTasks);
    }
  }, [ganttTasks, persistRank, onTaskRefetch]);

  // Grouped drag end — only reorders within the same group
  const handleGroupedDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeGroup = ganttGroups.find(g => g.tasks.some(t => t.id === activeId));
    const overGroup = ganttGroups.find(g => g.tasks.some(t => t.id === overId));
    if (!activeGroup || !overGroup || activeGroup.key !== overGroup.key) return;

    const oldIndex = ganttTasks.findIndex(t => t.id === activeId);
    const newIndex = ganttTasks.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(ganttTasks, oldIndex, newIndex);
    setGanttTasks(reordered);
    try {
      await persistRank(activeId, reordered, newIndex);
      if (onTaskRefetch) onTaskRefetch();
    } catch (err) {
      console.error("Grouped Gantt reorder failed:", err);
      setGanttTasks(ganttTasks);
    }
  }, [ganttTasks, ganttGroups, persistRank, onTaskRefetch]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, task: Task) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const href = safeWorkspaceSlug && safeProjectSlug
        ? `/${safeWorkspaceSlug}/${safeProjectSlug}/tasks/${task.slug}`
        : safeWorkspaceSlug ? `/${safeWorkspaceSlug}/tasks/${task.slug}` : `/tasks/${task.slug}`;
      router.push(href);
    }
  }, [safeWorkspaceSlug, safeProjectSlug, router]);

  const scrollToToday = useCallback(() => {
    if (scrollContainerRef.current && timeRange.days.length > 0) {
      const today = new Date();
      const todayIndex = timeRange.days.findIndex(d => d.toDateString() === today.toDateString());
      if (todayIndex !== -1) {
        const scrollPosition = todayIndex * cellWidth;
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition + infoPanelWidth - containerWidth / 2),
          behavior: "smooth",
        });
      }
    }
  }, [timeRange.days, cellWidth, infoPanelWidth]);

  const renderTaskRow = useCallback((task: Task) => (
    <SortableTaskRow
      key={task.id}
      task={task}
      isCompact={isCompact}
      isOverdue={parseDate(task.dueDate) < new Date() && task.status?.name?.toLowerCase() !== "done"}
      isHovered={hoveredTask === task.id}
      isFocused={focusedTask === task.id}
      safeWorkspaceSlug={safeWorkspaceSlug}
      safeProjectSlug={safeProjectSlug}
      timeRange={timeRange}
      viewMode={viewMode}
      onHover={setHoveredTask}
      onFocus={setFocusedTask}
      onKeyDown={handleKeyDown}
      onTaskUpdate={onTaskUpdate}
      taskRef={(el) => { if (el) taskRefs.current.set(task.id, el); else taskRefs.current.delete(task.id); }}
    />
  ), [isCompact, hoveredTask, focusedTask, safeWorkspaceSlug, safeProjectSlug, timeRange, viewMode, handleKeyDown, onTaskUpdate]);

  const EmptyRow = memo(({ index }: { index: number }) => (
    <div className="flex items-center border-b border-[var(--border)]" role="row">
      <div className={`${isCompact ? "w-48" : "w-80"} border-r border-[var(--border)] bg-[var(--card)] py-1 sticky left-0 z-10 h-12 shrink-0`} />
      <div className="flex-1 relative h-12" />
    </div>
  ));
  EmptyRow.displayName = "EmptyRow";

  if (!safeTasks.length) return <TaskTableSkeleton />;

  return (
    <div className="w-full bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--background)]/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="flex flex-col min-w-fit relative">
          <TimelineHeader
            timeRange={timeRange} viewMode={viewMode}
            isCompact={isCompact} scrollToToday={scrollToToday}
            visibleRange={visibleRange}
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={isGrouped ? handleGroupedDragEnd : handleDragEnd}
          >
            <div className="flex flex-col z-20 relative" role="rowgroup">
              {/* Background grid — shared across all rows */}
              <GanttGrid
                timeRange={timeRange} viewMode={viewMode}
                visibleRange={visibleRange} leftOffset={infoPanelWidth}
              />

              {isGrouped ? (
                /* ── GROUPED rendering ── */
                <>
                  {ganttGroups.map((group) => {
                    const collapsed = collapsedGroups.has(group.key);
                    return (
                      <div key={group.key}>
                        <GanttGroupHeader
                          label={group.label}
                          taskCount={group.tasks.length}
                          isCompact={isCompact}
                          infoPanelWidth={infoPanelWidth}
                          expanded={!collapsed}
                          onToggle={() => toggleGroup(group.key)}
                        />
                        {!collapsed && (
                          <SortableContext
                            items={group.tasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {group.tasks.map(renderTaskRow)}
                          </SortableContext>
                        )}
                      </div>
                    );
                  })}
                  {ganttGroups.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-[var(--muted-foreground)] text-sm">
                      No tasks found
                    </div>
                  )}
                </>
              ) : (
                /* ── FLAT rendering (original) ── */
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                  {(() => {
                    const rows: { type: string; data: Task | null }[] = ganttTasks.map(t => ({ type: "task", data: t }));
                    if (ganttTasks.length < MINIMUM_ROWS) {
                      for (let i = 0; i < MINIMUM_ROWS - ganttTasks.length; i++) {
                        rows.push({ type: "empty", data: null });
                      }
                    }
                    return rows.map((row, index) =>
                      row.type === "task" && row.data
                        ? renderTaskRow(row.data)
                        : <EmptyRow key={`empty-${index}`} index={index} />
                    );
                  })()}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

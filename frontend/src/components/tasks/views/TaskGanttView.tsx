import { useState, useEffect, useRef, useMemo, useCallback, type KeyboardEvent, memo } from "react";
import { formatDateForDisplay } from "@/utils/date";
import { useRouter } from "next/router";
import { HiCalendarDays, HiClipboardDocumentList } from "react-icons/hi2";
import type { Task, TaskGanttViewProps, TimeRange, ViewMode } from "@/types";
import { TaskInfoPanel } from "@/components/gantt/TaskInfoPanel";
import { getViewModeWidth, parseDate } from "@/utils/gantt";
import { TaskBar } from "@/components/gantt/TaskBar";
import { TimelineHeader } from "@/components/gantt/TimelineHeader";
import { GanttGrid } from "@/components/gantt/GanttGrid";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui";
import TaskTableSkeleton from "@/components/skeletons/TaskTableSkeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
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

const MINIMUM_ROWS = 9;
const SCROLL_BUFFER = 5; // Reduced for precision while maintaining performance

// Utility to validate slug strings: alphanumeric and dash only
function sanitizeSlug(slug: string | undefined): string | undefined {
  return slug && /^[a-zA-Z0-9\-]+$/.test(slug) ? slug : undefined;
}

// Optimized Sortable task row wrapper
const SortableTaskRow = memo(({
  task,
  isCompact,
  isOverdue,
  isHovered,
  isFocused,
  safeWorkspaceSlug,
  safeProjectSlug,
  timeRange,
  viewMode,
  onHover,
  onFocus,
  onKeyDown,
  onTaskUpdate,
  taskRef,
}: {
  task: Task;
  isCompact: boolean;
  isOverdue: boolean;
  isHovered: boolean;
  isFocused: boolean;
  safeWorkspaceSlug?: string;
  safeProjectSlug?: string;
  timeRange: TimeRange;
  viewMode: ViewMode;
  onHover: (id: string | null) => void;
  onFocus: (id: string | null) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  taskRef: (el: HTMLDivElement | null) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        taskRef(el);
      }}
      style={style}
      className={`flex items-center border-b border-[var(--border)] hover:bg-[var(--accent)] focus-within:bg-[var(--accent)] 
           ${isHovered ? "bg-[var(--accent)] " : ""} ${
        isFocused ? "bg-[var(--accent)] ring-2 ring-[var(--ring)] ring-offset-2" : ""
      } ${isOverdue ? "bg-red-50 dark:bg-red-900/10 " : ""} ${isDragging ? "shadow-lg rounded-md" : ""}`}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => onKeyDown(e, task)}
      tabIndex={0}
      role="row"
    >
      <TaskInfoPanel
        task={task}
        isCompact={isCompact}
        isOverdue={isOverdue}
        workspaceSlug={safeWorkspaceSlug || ""}
        projectSlug={safeProjectSlug}
        onFocus={onFocus}
        dragAttributes={attributes}
        dragListeners={listeners}
      />

      <TaskBar
        task={task}
        timeRange={timeRange}
        viewMode={viewMode}
        isCompact={isCompact}
        isHovered={isHovered}
        isFocused={isFocused}
        workspaceSlug={safeWorkspaceSlug || ""}
        projectSlug={safeProjectSlug}
        onHover={onHover}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onTaskUpdate={onTaskUpdate}
      />
    </div>
  );
});

SortableTaskRow.displayName = "SortableTaskRow";

export default function TaskGanttView({
  tasks,
  workspaceSlug,
  projectSlug,
  viewMode: externalViewMode,
  onViewModeChange,
  onTaskUpdate,
}: TaskGanttViewProps) {
  const router = useRouter();

  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(),
    end: new Date(),
    days: [],
  });
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("days");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  // Optimized virtualization state: only re-render when indices change
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 20 });

  const cellWidth = getViewModeWidth(viewMode);
  const infoPanelWidth = isCompact ? 192 : 320; // Matches TimelineHeader logic (w-48 / w-80)

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      // Adjust scrollLeft to be relative to the timeline area (start after info panel)
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

  // DND sensors
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
            scale.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
          break;
        case "weeks":
          current.setDate(current.getDate() - current.getDay());
          while (current <= end && scale.length < 500) {
            scale.push(new Date(current));
            current.setDate(current.getDate() + 7);
          }
          break;
        case "months":
          current.setDate(1);
          while (current <= end && scale.length < 200) {
            scale.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
          }
          break;
      }
    } catch (e) {
      return [new Date()];
    }
    return scale;
  }, []);

  // Process tasks and generate time range
  useEffect(() => {
    const processData = async () => {
      try {
        setIsLoading(true);
        const processedTasks = safeTasks.map((task, index) => {
          let startDate = task.startDate;
          let dueDate = task.dueDate;

          if (!startDate && !dueDate) {
            const baseDate = task.createdAt ? parseDate(task.createdAt) : new Date();
            startDate = new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString();
            dueDate = new Date(baseDate.getTime() + (index + 7) * 24 * 60 * 60 * 1000).toISOString();
          } else if (!startDate && dueDate) {
            const due = parseDate(dueDate);
            startDate = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          } else if (startDate && !dueDate) {
            const start = parseDate(startDate);
            dueDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          }

          return { ...task, startDate, dueDate };
        });

        let earliest = new Date();
        let latest = new Date();

        if (processedTasks.length > 0) {
          const allDates = processedTasks.flatMap((task) => [
            parseDate(task.startDate),
            parseDate(task.dueDate),
          ]);
          earliest = new Date(Math.min(...allDates.map((d) => d.getTime())));
          latest = new Date(Math.max(...allDates.map((d) => d.getTime())));
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

  const displayRows = useMemo(() => {
    const rows: { type: string; data: Task | null }[] = ganttTasks.map(t => ({ type: "task", data: t }));
    if (ganttTasks.length < MINIMUM_ROWS) {
      for (let i = 0; i < MINIMUM_ROWS - ganttTasks.length; i++) {
        rows.push({ type: "empty", data: null });
      }
    }
    return rows;
  }, [ganttTasks]);

  const taskIds = useMemo(() => ganttTasks.map((t) => t.id), [ganttTasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ganttTasks.findIndex((t) => t.id === active.id);
    const newIndex = ganttTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTasks = arrayMove(ganttTasks, oldIndex, newIndex);
    setGanttTasks(reorderedTasks);

    const updates = reorderedTasks.map((task, index) => ({ id: task.id, displayOrder: index + 1 }));
    try { await taskApi.reorderTasks(updates); } catch (error) { setGanttTasks(ganttTasks); }
  }, [ganttTasks]);

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
        scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPosition + infoPanelWidth - containerWidth / 2), behavior: "smooth" });
      }
    }
  }, [timeRange.days, cellWidth, infoPanelWidth]);

  const EmptyRow = memo(({ index }: { index: number }) => {
    return (
      <div className="flex items-center border-b border-[var(--border)]" role="row">
        <div className={`${isCompact ? "w-48" : "w-80"} border-r border-[var(--border)] bg-[var(--card)] py-1 sticky left-0 z-10 h-12 shrink-0`} />
        <div className="flex-1 relative h-12" />
      </div>
    );
  });
  EmptyRow.displayName = "EmptyRow";

  if (!safeTasks.length) return <TaskTableSkeleton />;

  return (
    <div className="w-full bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--background)]/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent"></div>
        </div>
      )}

      <div
        className="overflow-x-auto overflow-y-auto"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="flex flex-col min-w-fit relative">
          <TimelineHeader
            timeRange={timeRange}
            viewMode={viewMode}
            isCompact={isCompact}
            scrollToToday={scrollToToday}
            visibleRange={visibleRange}
          />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col z-20 relative" role="rowgroup">
                {/* Unified Background Grid Layer - Massive optimization */}
                <GanttGrid 
                  timeRange={timeRange} 
                  viewMode={viewMode} 
                  visibleRange={visibleRange} 
                  leftOffset={infoPanelWidth}
                />

                {displayRows.map((row, index) => (
                  row.type === "task" && row.data ? (
                    <SortableTaskRow
                      key={row.data.id}
                      task={row.data}
                      isCompact={isCompact}
                      isOverdue={parseDate(row.data.dueDate) < new Date() && row.data.status?.name?.toLowerCase() !== "done"}
                      isHovered={hoveredTask === row.data.id}
                      isFocused={focusedTask === row.data.id}
                      safeWorkspaceSlug={safeWorkspaceSlug}
                      safeProjectSlug={safeProjectSlug}
                      timeRange={timeRange}
                      viewMode={viewMode}
                      onHover={setHoveredTask}
                      onFocus={setFocusedTask}
                      onKeyDown={handleKeyDown}
                      onTaskUpdate={onTaskUpdate}
                      taskRef={(el) => { if (el) taskRefs.current.set(row.data!.id, el); else taskRefs.current.delete(row.data!.id); }}
                    />
                  ) : <EmptyRow key={`empty-${index}`} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

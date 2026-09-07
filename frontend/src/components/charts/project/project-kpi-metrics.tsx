import { StatCard } from "@/components/common/StatCard";
import {
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Check,
  Bug,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
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
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProjectKPIMetricsProps {
  data: {
    totalTasks: number;
    completedTasks: number;
    activeSprints: number;
    totalBugs: number;
    resolvedBugs: number;
    completionRate: number;
    bugResolutionRate: number;
  };
  taskStatus?: any[];
}

interface SortableStatCardProps {
  id: string;
  title?: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  indicatorColor?: string;
  iconBgColor?: string;
  cardBorderAccent?: string;
  cardGradient?: string;
  badge?: React.ReactNode;
  progress?: number;
  progressColor?: string;
  subtext?: React.ReactNode;
  onClick?: () => void;
}

function SortableStatCard({
  id,
  label,
  value,
  icon,
  indicatorColor,
  iconBgColor,
  cardBorderAccent,
  cardGradient,
  badge,
  progress,
  progressColor,
  subtext,
  onClick,
}: SortableStatCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "pointer",
    touchAction: "none",
    height: "100%",
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="h-full"
      {...attributes} 
      {...listeners}
      onClick={() => {
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <StatCard 
        label={label} 
        value={value} 
        icon={icon} 
        indicatorColor={indicatorColor}
        iconBgColor={iconBgColor}
        cardBorderAccent={cardBorderAccent}
        cardGradient={cardGradient}
        badge={badge}
        progress={progress}
        progressColor={progressColor}
        subtext={subtext}
      />
    </div>
  );
}

export function ProjectKPIMetrics({ data, taskStatus }: ProjectKPIMetricsProps) {
  const { t } = useTranslation(["analytics"]);
  const router = useRouter();

  const { workspaceSlug, projectSlug } = router.query;

  const [orderedIds, setOrderedIds] = useState<string[]>([
    "total-tasks",
    "completed-tasks",
    "active-sprints",
    "bug-resolution",
    "task-completion",
    "open-bugs",
  ]);

  const doneStatusIds = useMemo(() => {
    if (!taskStatus) return "";
    return taskStatus
      .filter((s) => s.status?.category === "DONE")
      .map((s) => s.statusId)
      .join(",");
  }, [taskStatus]);

  const openStatusIds = useMemo(() => {
    if (!taskStatus) return "";
    return taskStatus
      .filter((s) => s.status?.category !== "DONE")
      .map((s) => s.statusId)
      .join(",");
  }, [taskStatus]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNavigate = (path: string, query?: Record<string, string>) => {
    if (!workspaceSlug || !projectSlug) return;
    
    router.push({
      pathname: `/${workspaceSlug}/${projectSlug}${path}`,
      query,
    });
  };

  const displayCards = useMemo(() => {
    return orderedIds.map((id): SortableStatCardProps | null => {
      switch (id) {
        case "total-tasks":
          return {
            id,
            title: t("kpi.total_tasks.title"),
            label: t("kpi.total_tasks.label"),
            value: data?.totalTasks ?? 0,
            icon: <ListTodo className="h-4 w-4" />,
            indicatorColor: "bg-blue-500",
            iconBgColor: "bg-blue-50 text-blue-600 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
            cardBorderAccent: "bg-blue-500 dark:bg-blue-400",
            cardGradient: "from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/15 dark:via-transparent dark:to-transparent",
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                Tổng số
              </span>
            ),
            subtext: "Tất cả công việc",
            onClick: () => handleNavigate("/tasks"),
          };
        case "completed-tasks": {
          const total = data?.totalTasks ?? 0;
          const completed = data?.completedTasks ?? 0;
          const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            id,
            title: t("kpi.completed_tasks.title"),
            label: t("kpi.completed_tasks.label"),
            value: completed,
            icon: <CheckCircle2 className="h-4 w-4" />,
            indicatorColor: "bg-emerald-500",
            iconBgColor: "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
            cardBorderAccent: "bg-emerald-500 dark:bg-emerald-400",
            cardGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent",
            progress: completionPct,
            progressColor: "bg-gradient-to-r from-emerald-500 to-teal-400",
            subtext: `${completed}/${total} hoàn thành`,
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                {completionPct}%
              </span>
            ),
            onClick: () => handleNavigate("/tasks", doneStatusIds ? { statuses: doneStatusIds } : {}),
          };
        }
        case "active-sprints": {
          const activeCount = data?.activeSprints ?? 0;
          return {
            id,
            title: t("kpi.active_sprints.title"),
            label: t("kpi.active_sprints.label"),
            value: activeCount,
            icon: <Zap className="h-4 w-4" />,
            indicatorColor: "bg-violet-500",
            iconBgColor: "bg-violet-50 text-violet-600 border border-violet-200/70 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30",
            cardBorderAccent: "bg-violet-500 dark:bg-violet-400",
            cardGradient: "from-violet-500/10 via-violet-500/5 to-transparent dark:from-violet-500/15 dark:via-transparent dark:to-transparent",
            badge: activeCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                Đang chạy
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                N/A
              </span>
            ),
            subtext: "Sprint đang thực thi",
            onClick: () => handleNavigate("/sprints"),
          };
        }
        case "bug-resolution": {
          const rate = data?.bugResolutionRate ?? 0;
          const resolved = data?.resolvedBugs ?? 0;
          const total = data?.totalBugs ?? 0;
          return {
            id,
            title: t("kpi.bug_resolution.title"),
            label: t("kpi.bug_resolution.label"),
            value: `${rate.toFixed(1)}%`,
            icon: <ShieldCheck className="h-4 w-4" />,
            indicatorColor: "bg-teal-500",
            iconBgColor: "bg-teal-50 text-teal-600 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30",
            cardBorderAccent: "bg-teal-500 dark:bg-teal-400",
            cardGradient: "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/15 dark:via-transparent dark:to-transparent",
            progress: rate,
            progressColor: "bg-gradient-to-r from-teal-500 to-emerald-400",
            subtext: `${resolved}/${total} đã giải quyết`,
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30">
                {resolved}/{total}
              </span>
            ),
            onClick: () => handleNavigate("/tasks", doneStatusIds ? { statuses: doneStatusIds, types: "BUG" } : {}),
          };
        }
        case "task-completion": {
          const rate = data?.completionRate ?? 0;
          return {
            id,
            title: t("kpi.task_completion.title"),
            label: t("kpi.task_completion.label"),
            value: `${rate.toFixed(1)}%`,
            icon: <TrendingUp className="h-4 w-4" />,
            indicatorColor: "bg-amber-500",
            iconBgColor: "bg-amber-50 text-amber-600 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
            cardBorderAccent: "bg-amber-500 dark:bg-amber-400",
            cardGradient: "from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-transparent dark:to-transparent",
            progress: rate,
            progressColor: "bg-gradient-to-r from-amber-500 to-orange-400",
            subtext: "Tiến độ công việc",
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                {rate >= 75 ? "Tốt" : "Cần chú ý"}
              </span>
            ),
            onClick: () => handleNavigate("/tasks", doneStatusIds ? { statuses: doneStatusIds } : {}),
          };
        }
        case "open-bugs": {
          const openBugsCount = Math.max((data?.totalBugs ?? 0) - (data?.resolvedBugs ?? 0), 0);
          const isClean = openBugsCount === 0;
          return {
            id,
            title: t("kpi.open_bugs.title"),
            label: t("kpi.open_bugs.label"),
            value: openBugsCount,
            icon: isClean ? <Sparkles className="h-4 w-4" /> : <Bug className="h-4 w-4" />,
            indicatorColor: isClean ? "bg-emerald-500" : "bg-rose-500",
            iconBgColor: isClean
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
              : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 animate-pulse",
            cardBorderAccent: isClean ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400",
            cardGradient: isClean
              ? "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent"
              : "from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/15 dark:via-transparent dark:to-transparent",
            badge: isClean ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                <Check className="h-3 w-3" />
                Sạch lỗi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                <AlertTriangle className="h-3 w-3" />
                Cần sửa
              </span>
            ),
            subtext: isClean ? "Không có lỗi tồn đọng" : `${openBugsCount} lỗi đang mở`,
            onClick: () => handleNavigate("/tasks", openStatusIds ? { types: "BUG", statuses: openStatusIds } : {}),
          };
        }
        default:
          return null;
      }
    }).filter((c): c is SortableStatCardProps => c !== null);
  }, [orderedIds, data, workspaceSlug, projectSlug, doneStatusIds, openStatusIds, t]);

  if (!router.isReady) {
    return null;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {displayCards.map((card) => (
            <SortableStatCard 
              key={card.id} 
              id={card.id}
              label={card.label}
              value={card.value}
              icon={card.icon}
              indicatorColor={card.indicatorColor}
              iconBgColor={card.iconBgColor}
              cardBorderAccent={card.cardBorderAccent}
              cardGradient={card.cardGradient}
              badge={card.badge}
              progress={card.progress}
              progressColor={card.progressColor}
              subtext={card.subtext}
              onClick={card.onClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

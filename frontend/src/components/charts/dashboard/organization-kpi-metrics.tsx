import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Building2,
  FolderOpen,
  Users,
  CheckCircle2,
  Bug,
  Zap,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
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
import { useTranslation } from "react-i18next";

interface OrganizationKPIMetricsProps {
  data: {
    totalWorkspaces: number;
    activeWorkspaces: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalBugs: number;
    resolvedBugs: number;
    activeSprints: number;
    projectCompletionRate: number;
    taskCompletionRate: number;
    bugResolutionRate: number;
    overallProductivity: number;
  };
  visibleCards?: Array<{
    id: string;
    label: string;
    visible: boolean;
    isDefault: boolean;
    link?: string;
  }>;
  onOrderChange?: (newOrder: string[]) => void;
  taskStatuses?: any[];
}

interface SortableStatCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
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
    cursor: isDragging ? "grabbing" : (onClick ? "pointer" : "default"),
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

export function OrganizationKPIMetrics({
  data,
  visibleCards = [],
  onOrderChange,
  taskStatuses = [],
}: OrganizationKPIMetricsProps) {
  const { t } = useTranslation("workspace-home");
  const router = useRouter();

  // Initialize orderedIds based on visibleCards prop or default static config
  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    if (visibleCards.length > 0) {
      return visibleCards.filter((card) => card.visible).map((card) => card.id);
    }
    return ["workspaces", "projects", "members", "task-completion"];
  });

  // Compute done status IDs from task statuses
  const doneStatusIds = useMemo(() => {
    if (!taskStatuses || taskStatuses.length === 0) return "";
    return taskStatuses
      .filter((s) => s.category === "DONE")
      .map((s) => s.id)
      .join(",");
  }, [taskStatuses]);

  // Sync state if visibleCards prop changes order or visibility externally
  useEffect(() => {
    if (visibleCards.length > 0) {
      const visibleIds = visibleCards.filter((c) => c.visible).map((c) => c.id);
      if (JSON.stringify(visibleIds) !== JSON.stringify(orderedIds)) {
        setOrderedIds(visibleIds);
      }
    }
  }, [visibleCards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px movement before drag starts (prevents accidental clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id as string);
      const newIndex = orderedIds.indexOf(over.id as string);
      const newOrder = arrayMove(orderedIds, oldIndex, newIndex);

      setOrderedIds(newOrder);

      if (onOrderChange) {
        onOrderChange(newOrder);
      }
    }
  };

  // Build rich, intuitive, colorful stat cards matching Project Analytics cards
  const displayCards = useMemo(() => {
    return orderedIds
      .map((id): SortableStatCardProps | null => {
        switch (id) {
          case "workspaces": {
            const total = data?.totalWorkspaces ?? 0;
            const active = data?.activeWorkspaces ?? total;
            return {
              id,
              label: t("analytics.kpi_cards.workspaces", "Tổng Workspace"),
              value: total,
              icon: <Building2 className="h-4 w-4" />,
              indicatorColor: "bg-blue-500",
              iconBgColor:
                "bg-blue-50 text-blue-600 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
              cardBorderAccent: "bg-blue-500 dark:bg-blue-400",
              cardGradient:
                "from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                  Tổng số
                </span>
              ),
              subtext: `${active} đang hoạt động`,
              onClick: () => router.push("/workspaces"),
            };
          }

          case "projects": {
            const total = data?.totalProjects ?? 0;
            const active = data?.activeProjects ?? 0;
            return {
              id,
              label: t("analytics.kpi_cards.projects", "Tổng dự án"),
              value: total,
              icon: <FolderOpen className="h-4 w-4" />,
              indicatorColor: "bg-indigo-500",
              iconBgColor:
                "bg-indigo-50 text-indigo-600 border border-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
              cardBorderAccent: "bg-indigo-500 dark:bg-indigo-400",
              cardGradient:
                "from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                  {active} hoạt động
                </span>
              ),
              subtext: `${active} đang hoạt động`,
              onClick: () => router.push("/projects"),
            };
          }

          case "members": {
            const membersCount = data?.totalMembers ?? 0;
            const memberLink =
              visibleCards.find((c) => c.id === "members")?.link || "/organization";
            return {
              id,
              label: t("analytics.kpi_cards.members", "Thành viên nhóm"),
              value: membersCount,
              icon: <Users className="h-4 w-4" />,
              indicatorColor: "bg-emerald-500",
              iconBgColor:
                "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
              cardBorderAccent: "bg-emerald-500 dark:bg-emerald-400",
              cardGradient:
                "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Thành viên
                </span>
              ),
              subtext: t(
                "analytics.kpi_cards.descriptions.organization_members",
                "Thành viên tổ chức"
              ),
              onClick: () => router.push(memberLink),
            };
          }

          case "task-completion": {
            const rate = data?.taskCompletionRate ?? 0;
            const completed = data?.completedTasks ?? 0;
            const total = data?.totalTasks ?? 0;
            const completionPct = Math.min(Math.max(Math.round(rate), 0), 100);
            return {
              id,
              label: t("analytics.kpi_cards.task_completion", "Hoàn thành công việc"),
              value: `${rate.toFixed(1)}%`,
              icon: <CheckCircle2 className="h-4 w-4" />,
              indicatorColor: "bg-purple-500",
              iconBgColor:
                "bg-purple-50 text-purple-600 border border-purple-200/70 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
              cardBorderAccent: "bg-purple-500 dark:bg-purple-400",
              cardGradient:
                "from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30">
                  {rate >= 75 ? "Tốt" : rate >= 50 ? "Khá" : "Cần tăng tốc"}
                </span>
              ),
              progress: completionPct,
              progressColor: "bg-gradient-to-r from-purple-500 to-pink-500",
              subtext: `${completed}/${total} hoàn thành`,
              onClick: () =>
                router.push(
                  doneStatusIds ? `/tasks?statuses=${doneStatusIds}&types=TASK` : "/tasks"
                ),
            };
          }

          case "bug-resolution": {
            const rate = data?.bugResolutionRate ?? 0;
            const resolved = data?.resolvedBugs ?? 0;
            const total = data?.totalBugs ?? 0;
            const resolutionPct = Math.min(Math.max(Math.round(rate), 0), 100);
            return {
              id,
              label: t("analytics.kpi_cards.bug_resolution", "Xử lý lỗi (Bug)"),
              value: `${rate.toFixed(1)}%`,
              icon: <ShieldCheck className="h-4 w-4" />,
              indicatorColor: "bg-teal-500",
              iconBgColor:
                "bg-teal-50 text-teal-600 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30",
              cardBorderAccent: "bg-teal-500 dark:bg-teal-400",
              cardGradient:
                "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30">
                  {resolved}/{total}
                </span>
              ),
              progress: resolutionPct,
              progressColor: "bg-gradient-to-r from-teal-500 to-emerald-400",
              subtext: `${resolved}/${total} đã giải quyết`,
              onClick: () =>
                router.push(
                  doneStatusIds ? `/tasks?statuses=${doneStatusIds}&types=BUG` : "/tasks"
                ),
            };
          }

          case "overdue-tasks": {
            const overdueCount = data?.overdueTasks ?? 0;
            const isClean = overdueCount === 0;
            return {
              id,
              label: t("analytics.kpi_cards.overdue_tasks", "Công việc quá hạn"),
              value: overdueCount,
              icon: isClean ? <Sparkles className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />,
              indicatorColor: isClean ? "bg-emerald-500" : "bg-rose-500",
              iconBgColor: isClean
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 animate-pulse",
              cardBorderAccent: isClean
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-rose-500 dark:bg-rose-400",
              cardGradient: isClean
                ? "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent"
                : "from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/15 dark:via-transparent dark:to-transparent",
              badge: isClean ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                  <Check className="h-3 w-3" />
                  Đúng hạn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  Cần chú ý
                </span>
              ),
              subtext: isClean ? "Không có việc quá hạn" : `${overdueCount} việc cần xử lý ngay`,
              onClick: () => router.push("/tasks"),
            };
          }

          case "active-sprints": {
            const activeCount = data?.activeSprints ?? 0;
            return {
              id,
              label: t("analytics.kpi_cards.active_sprints", "Sprint đang chạy"),
              value: activeCount,
              icon: <Zap className="h-4 w-4" />,
              indicatorColor: "bg-cyan-500",
              iconBgColor:
                "bg-cyan-50 text-cyan-600 border border-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30",
              cardBorderAccent: "bg-cyan-500 dark:bg-cyan-400",
              cardGradient:
                "from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/15 dark:via-transparent dark:to-transparent",
              badge:
                activeCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    Đang chạy
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    N/A
                  </span>
                ),
              subtext: "Sprint đang thực thi",
            };
          }

          case "productivity": {
            const rate = data?.overallProductivity || 0;
            const prodPct = Math.min(Math.max(Math.round(rate), 0), 100);
            return {
              id,
              label: t("analytics.kpi_cards.productivity", "Năng suất tổng thể"),
              value: `${rate.toFixed(1)}%`,
              icon: <TrendingUp className="h-4 w-4" />,
              indicatorColor: "bg-amber-500",
              iconBgColor:
                "bg-amber-50 text-amber-600 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
              cardBorderAccent: "bg-amber-500 dark:bg-amber-400",
              cardGradient:
                "from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-transparent dark:to-transparent",
              badge: (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                  {rate >= 75 ? "Tốt" : rate >= 50 ? "Khá" : "Cần cải thiện"}
                </span>
              ),
              progress: prodPct,
              progressColor: "bg-gradient-to-r from-amber-500 to-orange-400",
              subtext: "Hiệu suất tổ chức",
            };
          }

          default:
            return null;
        }
      })
      .filter((card): card is SortableStatCardProps => card !== null);
  }, [orderedIds, data, t, doneStatusIds, visibleCards, router]);

  const visibleCount = displayCards.length;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div
          className={`grid gap-3.5 ${
            visibleCount <= 4
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              : visibleCount <= 6
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8"
          }`}
        >
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

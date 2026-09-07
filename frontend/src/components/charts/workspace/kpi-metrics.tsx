// components/charts/workspace/kpi-metrics.tsx
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  ListTodo,
  ShieldCheck,
  Sparkles,
  Check,
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

interface KPIMetricsProps {
  data: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  workspaceId?: string;
}

interface SortableStatCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  statSuffix?: React.ReactNode;
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
  statSuffix,
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
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={(e) => {
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <StatCard
        label={label}
        value={value}
        icon={icon}
        statSuffix={statSuffix}
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

export function KPIMetrics({ data, workspaceId }: KPIMetricsProps) {
  const { t } = useTranslation("workspace-home");
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleNavigate = (path: string, query?: Record<string, string>) => {
    if (!workspaceSlug) return;
    router.push({
      pathname: `/${workspaceSlug}${path}`,
      query,
    });
  };

  const [orderedIds, setOrderedIds] = useState<string[]>([
    "total-projects",
    "active-projects",
    "completion-rate",
    "total-tasks",
    "overdue-tasks",
    "task-health",
  ]);

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

  const displayCards = useMemo(() => {
    return orderedIds.map((id): SortableStatCardProps | null => {
      switch (id) {
        case "total-projects":
          return {
            id,
            label: t("kpi.total_projects"),
            value: data?.totalProjects ?? 0,
            icon: <FolderOpen className="h-4 w-4" />,
            indicatorColor: "bg-indigo-500",
            iconBgColor: "bg-indigo-50 text-indigo-600 border border-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
            cardBorderAccent: "bg-indigo-500 dark:bg-indigo-400",
            cardGradient: "from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/15 dark:via-transparent dark:to-transparent",
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                Tổng số
              </span>
            ),
            subtext: "Dự án trong workspace",
            onClick: () => handleNavigate("/projects"),
          };
        case "active-projects": {
          const total = data?.totalProjects ?? 0;
          const active = data?.activeProjects ?? 0;
          const pct = total > 0 ? (active / total) * 100 : 0;
          return {
            id,
            label: t("kpi.active_projects"),
            value: active,
            icon: <TrendingUp className="h-4 w-4" />,
            indicatorColor: "bg-cyan-500",
            iconBgColor: "bg-cyan-50 text-cyan-600 border border-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30",
            cardBorderAccent: "bg-cyan-500 dark:bg-cyan-400",
            cardGradient: "from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/15 dark:via-transparent dark:to-transparent",
            progress: pct,
            progressColor: "bg-gradient-to-r from-cyan-500 to-teal-400",
            subtext: `${active}/${total} đang hoạt động`,
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
                {pct.toFixed(0)}%
              </span>
            ),
            onClick: () => handleNavigate("/projects", { statuses: "ACTIVE" }),
          };
        }
        case "completion-rate": {
          const rate = data?.completionRate ?? 0;
          return {
            id,
            label: t("kpi.completion_rate"),
            value: `${rate.toFixed(1)}%`,
            icon: rate > 70 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
            indicatorColor: "bg-emerald-500",
            iconBgColor: "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
            cardBorderAccent: "bg-emerald-500 dark:bg-emerald-400",
            cardGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent",
            progress: rate,
            progressColor: "bg-gradient-to-r from-emerald-500 to-teal-400",
            subtext: rate > 70 ? t("kpi.excellent") : rate > 50 ? t("kpi.good") : t("kpi.needs_focus"),
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                {rate > 70 ? t("kpi.excellent") : rate > 50 ? t("kpi.good") : t("kpi.needs_focus")}
              </span>
            ),
            onClick: () => handleNavigate("/projects", { statuses: "COMPLETED" }),
          };
        }
        case "total-tasks":
          return {
            id,
            label: t("kpi.total_tasks"),
            value: data?.totalTasks ?? 0,
            icon: <ListTodo className="h-4 w-4" />,
            indicatorColor: "bg-blue-500",
            iconBgColor: "bg-blue-50 text-blue-600 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
            cardBorderAccent: "bg-blue-500 dark:bg-blue-400",
            cardGradient: "from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/15 dark:via-transparent dark:to-transparent",
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                Nhiệm vụ
              </span>
            ),
            subtext: "Tất cả công việc",
            onClick: () => handleNavigate("/tasks"),
          };
        case "overdue-tasks": {
          const overdue = data?.overdueTasks ?? 0;
          const isZero = overdue === 0;
          return {
            id,
            label: t("kpi.overdue_tasks"),
            value: overdue,
            icon: isZero ? <Sparkles className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />,
            indicatorColor: isZero ? "bg-emerald-500" : "bg-rose-500",
            iconBgColor: isZero
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
              : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 animate-pulse",
            cardBorderAccent: isZero ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400",
            cardGradient: isZero
              ? "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-transparent dark:to-transparent"
              : "from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/15 dark:via-transparent dark:to-transparent",
            badge: isZero ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                <Check className="h-3 w-3" />
                {t("kpi.perfect")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                <AlertTriangle className="h-3 w-3" />
                {overdue < 10 ? t("kpi.good") : t("kpi.critical")}
              </span>
            ),
            subtext: isZero ? "Không trễ hạn" : `${overdue} công việc quá hạn`,
            onClick: () => handleNavigate("/tasks"),
          };
        }
        case "task-health": {
          const total = data?.totalTasks ?? 0;
          const overdue = data?.overdueTasks ?? 0;
          const healthRate = total > 0 ? (((total - overdue) / total) * 100) : 100;
          return {
            id,
            label: t("kpi.task_health"),
            value: `${healthRate.toFixed(1)}%`,
            icon: <ShieldCheck className="h-4 w-4" />,
            indicatorColor: "bg-teal-500",
            iconBgColor: "bg-teal-50 text-teal-600 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30",
            cardBorderAccent: "bg-teal-500 dark:bg-teal-400",
            cardGradient: "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-500/15 dark:via-transparent dark:to-transparent",
            progress: healthRate,
            progressColor: "bg-gradient-to-r from-teal-500 to-emerald-400",
            subtext: overdue === 0 ? "Sức khỏe dự án tối ưu" : `${total - overdue}/${total} đúng hạn`,
            badge: (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/70 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30">
                {overdue === 0 ? t("kpi.perfect") : t("kpi.monitor")}
              </span>
            ),
          };
        }
        default:
          return null;
      }
    }).filter((c): c is SortableStatCardProps => c !== null);
  }, [orderedIds, data, workspaceSlug, t]);

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
              statSuffix={card.statSuffix}
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

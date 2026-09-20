// components/charts/workspace/task-type-chart.tsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";

const TASK_TYPE_CONFIG: Record<string, { labelKey: string; defaultLabel: string; color: string }> = {
  STORY: { labelKey: "task_types.story", defaultLabel: "Story", color: "#10B981" },
  TASK: { labelKey: "task_types.task", defaultLabel: "Task", color: "#3B82F6" },
  BUG: { labelKey: "task_types.bug", defaultLabel: "Bug", color: "#EF4444" },
  EPIC: { labelKey: "task_types.epic", defaultLabel: "Epic", color: "#8B5CF6" },
  FEATURE: { labelKey: "task_types.feature", defaultLabel: "Feature", color: "#F59E0B" },
  SUBTASK: { labelKey: "task_types.subtask", defaultLabel: "Subtask", color: "#F97316" },
};

interface TaskTypeChartProps {
  data: Array<{ type: string; _count: { type: number } }>;
  workspaceId?: string;
}

export function TaskTypeChart({ data, workspaceId }: TaskTypeChartProps) {
  const { t } = useTranslation(["workspace-home"]);
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.entries(TASK_TYPE_CONFIG).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(val.labelKey, val.defaultLabel),
        color: val.color,
      };
      return acc;
    }, {} as ChartConfig);
  }, [t]);

  const rawData = data || [];
  const chartData = useMemo(() => {
    return rawData.map((item) => {
      const typeKey = (item?.type || "TASK").toUpperCase();
      const config = TASK_TYPE_CONFIG[typeKey] || {
        labelKey: typeKey,
        defaultLabel: item?.type || "Task",
        color: "#8B5CF6",
      };
      const count = item?._count?.type ?? (item as any)?.count ?? 0;
      return {
        id: typeKey,
        name: t(config.labelKey, config.defaultLabel),
        value: count,
        color: config.color,
      };
    });
  }, [rawData, t]);

  const totalTasks = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  const displayData = useMemo(() => {
    if (totalTasks === 0) {
      return [{ id: "EMPTY", name: t("no_data") || "Chưa có công việc", value: 1, color: "var(--muted)" }];
    }
    return chartData.filter((item) => item.value > 0);
  }, [chartData, totalTasks, t]);

  const handleClick = (entry: any) => {
    const slug = workspaceSlug || workspaceId;
    if (
      slug &&
      typeof slug === "string" &&
      /^[a-zA-Z0-9-]+$/.test(slug) &&
      entry?.id &&
      entry.id !== "EMPTY"
    ) {
      router.push({
        pathname: "/[workspaceSlug]/tasks",
        query: { workspaceSlug: slug, types: entry.id },
      });
    }
  };

  return (
    <ChartWrapper
      title={t("widgets.task_type", "Phân bổ loại công việc")}
      description={t("charts.task_type_description", "Phân bổ công việc theo loại")}
      config={chartConfig}
      icon={<Layers className="h-4 w-4" />}
      footer={
        totalTasks > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {chartData
              .filter((item) => item.value > 0)
              .map((item) => {
                const percentage =
                  totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleClick(item)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/40 border border-border/50 transition-colors hover:bg-muted/70 cursor-pointer"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground text-[11px]">{item.name}:</span>
                    <span className="font-semibold text-foreground font-mono text-[11px]">{item.value}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      ({percentage}%)
                    </span>
                  </button>
                );
              })}
          </div>
        ) : null
      }
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            totalTasks > 0 ? (
              <ChartTooltipContent hideLabel className="bg-popover text-popover-foreground border-border shadow-md" />
            ) : () => null
          }
        />
        <Pie
          data={displayData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={72}
          paddingAngle={totalTasks > 0 ? 3 : 0}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--background)"
          isAnimationActive={true}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {displayData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              onClick={() => handleClick(entry)}
              className="cursor-pointer outline-hidden"
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 2}
                      className="fill-foreground text-2xl font-extrabold font-mono tracking-tight"
                    >
                      {totalTasks.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 18}
                      className="fill-muted-foreground text-[11px] font-medium"
                    >
                      {t("kpi.total_tasks") || "Công việc"}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </Pie>
      </PieChart>
    </ChartWrapper>
  );
}


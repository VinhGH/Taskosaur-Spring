// components/charts/project/task-type-chart.tsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";

const chartConfig: Record<string, { labelKey: string; defaultLabel: string; color: string }> = {
  STORY: { labelKey: "charts.task_type_distribution.types.story", defaultLabel: "Story", color: "#10B981" },
  TASK: { labelKey: "charts.task_type_distribution.types.task", defaultLabel: "Task (Nhiệm vụ)", color: "#3B82F6" },
  BUG: { labelKey: "charts.task_type_distribution.types.bug", defaultLabel: "Bug (Lỗi)", color: "#EF4444" },
  EPIC: { labelKey: "charts.task_type_distribution.types.epic", defaultLabel: "Epic", color: "#8B5CF6" },
  FEATURE: { labelKey: "charts.task_type_distribution.types.feature", defaultLabel: "Feature", color: "#F59E0B" },
  SUBTASK: { labelKey: "charts.task_type_distribution.types.subtask", defaultLabel: "Subtask", color: "#8B5CF6" },
};

interface TaskTypeChartProps {
  data: Array<{ type: string; _count: { type: number } }>;
}

export function TaskTypeChart({ data }: TaskTypeChartProps) {
  const { t } = useTranslation(["analytics"]);
  const safeData = Array.isArray(data) ? data : [];

  const translatedConfig = useMemo<ChartConfig>(() => {
    return Object.entries(chartConfig).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(val.labelKey, val.defaultLabel),
        color: val.color,
      };
      return acc;
    }, {} as ChartConfig);
  }, [t]);

  const typeOrder = ["TASK", "BUG", "STORY", "FEATURE", "SUBTASK", "EPIC"];

  const chartData = useMemo(() => {
    const countMap = new Map<string, number>();
    safeData.forEach((item) => {
      const typeKey = (item?.type || "").toUpperCase();
      const count = item?._count?.type ?? (item as any)?.count ?? 0;
      countMap.set(typeKey, count);
    });

    // Only include types that exist or standard top types
    return typeOrder
      .map((key) => {
        const meta = chartConfig[key] || {
          labelKey: key,
          defaultLabel: key,
          color: "#8B5CF6",
        };
        const count = countMap.get(key) || 0;
        return {
          key,
          name: t(meta.labelKey, meta.defaultLabel),
          value: count,
          color: meta.color,
        };
      })
      .filter((item) => item.value > 0 || ["TASK", "BUG", "SUBTASK"].includes(item.key));
  }, [safeData, t]);

  const totalTasks = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  return (
    <ChartWrapper
      title={t("charts.task_type_distribution.title", "Phân bổ loại công việc")}
      description={t("charts.task_type_distribution.description", "Các loại công việc trong dự án này")}
      config={translatedConfig}
      icon={<Layers className="h-4 w-4" />}
      footer={
        totalTasks > 0 ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{t("kpi.total_tasks.label", "Tổng công việc")}: <strong className="text-foreground font-mono">{totalTasks}</strong></span>
            <span className="text-[11px] text-muted-foreground">Phân loại theo type</span>
          </div>
        ) : null
      }
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 22, right: 12, left: 2, bottom: 0 }}
        barCategoryGap="18%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          fontSize={11}
          fontWeight={500}
          tick={{ fill: "var(--foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickMargin={6}
          fontSize={11}
          width={32}
          tick={{ fill: "var(--muted-foreground)" }}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.15 }}
          content={
            <ChartTooltipContent
              hideLabel
              className="bg-popover text-popover-foreground border-border shadow-md"
            />
          }
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          maxBarSize={42}
          isAnimationActive={true}
          animationDuration={900}
          animationEasing="ease-out"
        >
          <LabelList
            dataKey="value"
            position="top"
            offset={6}
            className="fill-foreground font-mono font-bold text-xs"
            formatter={(val: any) => (Number(val) > 0 ? val : "")}
          />
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.key}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
}


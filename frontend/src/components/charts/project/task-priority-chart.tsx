// components/charts/project/task-priority-chart.tsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useTranslation } from "react-i18next";
import { SignalHigh } from "lucide-react";

const PRIORITY_META: Record<string, { labelKey: string; defaultLabel: string; color: string }> = {
  LOWEST: { labelKey: "charts.task_priority_distribution.priorities.lowest", defaultLabel: "Rất thấp", color: "#94A3B8" },
  LOW: { labelKey: "charts.task_priority_distribution.priorities.low", defaultLabel: "Thấp", color: "#10B981" },
  MEDIUM: { labelKey: "charts.task_priority_distribution.priorities.medium", defaultLabel: "Trung bình", color: "#F59E0B" },
  HIGH: { labelKey: "charts.task_priority_distribution.priorities.high", defaultLabel: "Cao", color: "#F97316" },
  HIGHEST: { labelKey: "charts.task_priority_distribution.priorities.highest", defaultLabel: "Khẩn cấp", color: "#EF4444" },
};

interface TaskPriorityChartProps {
  data: Array<{ priority: string; _count: { priority: number } }>;
}

export function TaskPriorityChart({ data }: TaskPriorityChartProps) {
  const { t } = useTranslation(["analytics"]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.entries(PRIORITY_META).reduce((acc, [key, val]) => {
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
      const pKey = (item.priority || "MEDIUM").toUpperCase();
      const meta = PRIORITY_META[pKey] || {
        labelKey: pKey,
        defaultLabel: item.priority || "Medium",
        color: "#8B5CF6",
      };
      const count = item._count?.priority ?? (item as any)?.count ?? 0;
      return {
        key: pKey,
        name: t(meta.labelKey, meta.defaultLabel),
        value: count,
        color: meta.color,
      };
    });
  }, [rawData, t]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  const displayData = useMemo(() => {
    if (total === 0) {
      return [{ key: "EMPTY", name: t("no_data_available", "Chưa có công việc"), value: 1, color: "var(--muted)" }];
    }
    return chartData.filter((item) => item.value > 0);
  }, [chartData, total, t]);

  return (
    <ChartWrapper
      title={t("charts.task_priority_distribution.title", "Phân bổ độ ưu tiên công việc")}
      description={t("charts.task_priority_distribution.description", "Phân loại độ ưu tiên của các công việc trong dự án")}
      config={chartConfig}
      icon={<SignalHigh className="h-4 w-4" />}
      footer={
        total > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {chartData
              .filter((item) => item.value > 0)
              .map((item) => {
                const percentage =
                  total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/40 border border-border/50"
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
                  </div>
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
            total > 0 ? (
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
          paddingAngle={total > 0 ? 3 : 0}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--background)"
        >
          {displayData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
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
                      {total.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 18}
                      className="fill-muted-foreground text-[11px] font-medium"
                    >
                      {t("kpi.total_tasks.label", "Công việc")}
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


// components/charts/dashboard/task-distribution-chart.tsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";
import { useTranslation } from "react-i18next";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { SignalHigh } from "lucide-react";

const PRIORITY_ORDER = ["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"] as const;

const PRIORITY_META: Record<string, { labelKey: string; color: string }> = {
  LOWEST: { labelKey: "priority.lowest", color: "#94A3B8" },
  LOW: { labelKey: "priority.low", color: "#10B981" },
  MEDIUM: { labelKey: "priority.medium", color: "#F59E0B" },
  HIGH: { labelKey: "priority.high", color: "#F97316" },
  HIGHEST: { labelKey: "priority.highest", color: "#EF4444" },
};

interface TaskDistributionChartProps {
  data: Array<{ priority: string; _count: { priority: number } }>;
}

export function TaskDistributionChart({ data }: TaskDistributionChartProps) {
  const { t } = useTranslation("workspace-home");

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.entries(PRIORITY_META).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(val.labelKey),
        color: val.color,
      };
      return acc;
    }, {} as ChartConfig);
  }, [t]);

  const rawData = data || [];
  const chartData = useMemo(() => {
    // Index counts by priority key
    const countMap = new Map<string, number>();
    rawData.forEach((item) => {
      const pKey = (item?.priority || "").toUpperCase();
      const count = item?._count?.priority ?? (item as any)?.count ?? 0;
      countMap.set(pKey, count);
    });

    return PRIORITY_ORDER.map((key) => {
      const meta = PRIORITY_META[key];
      const count = countMap.get(key) || 0;
      return {
        key,
        priority: t(meta.labelKey) || key,
        count,
        fill: meta.color,
      };
    });
  }, [rawData, t]);

  const totalTasks = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.count || 0), 0),
    [chartData]
  );

  const urgentCount = useMemo(() => {
    const high = chartData.find((d) => d.key === "HIGH")?.count || 0;
    const highest = chartData.find((d) => d.key === "HIGHEST")?.count || 0;
    return high + highest;
  }, [chartData]);

  return (
    <ChartWrapper
      title={t("widgets.task_priority")}
      description={t("charts.task_priority_description")}
      config={chartConfig}
      icon={<SignalHigh className="h-4 w-4" />}
      footer={
        totalTasks > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>{t("kpi.total_tasks")}:</span>
              <strong className="text-foreground font-mono">{totalTasks}</strong>
            </div>
            {urgentCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {urgentCount} cần ưu tiên cao / khẩn cấp
              </span>
            ) : (
              <span className="text-[11px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ✓ Khối lượng ưu tiên cân bằng
              </span>
            )}
          </div>
        ) : null
      }
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 20, right: 12, left: -15, bottom: 0 }}
        barCategoryGap="15%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="priority"
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
          width={30}
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
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          <LabelList
            dataKey="count"
            position="top"
            offset={8}
            className="fill-foreground font-mono font-bold text-xs"
            formatter={(val: any) => (Number(val) > 0 ? val : "")}
          />
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.key}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
}


// components/charts/workspace/sprint-status-chart.tsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";

const SPRINT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Lập kế hoạch", color: "#94A3B8" },
  ACTIVE: { label: "Đang chạy", color: "#10B981" },
  COMPLETED: { label: "Hoàn thành", color: "#3B82F6" },
  CANCELLED: { label: "Đã hủy", color: "#EF4444" },
};

interface SprintStatusChartProps {
  data: Array<{ status: string; _count: { status: number } }>;
}

export function SprintStatusChart({ data }: SprintStatusChartProps) {
  const { t } = useTranslation(["workspace-home"]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.entries(SPRINT_STATUS_CONFIG).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(`sprint_status.${key.toLowerCase()}`, val.label),
        color: val.color,
      };
      return acc;
    }, {} as ChartConfig);
  }, [t]);

  const rawData = data || [];
  const statusOrder = ["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"];

  const chartData = useMemo(() => {
    const countMap = new Map<string, number>();
    rawData.forEach((item) => {
      const sKey = (item?.status || "").toUpperCase();
      const count = item?._count?.status ?? (item as any)?.count ?? 0;
      countMap.set(sKey, count);
    });

    return statusOrder.map((key) => {
      const config = SPRINT_STATUS_CONFIG[key];
      const count = countMap.get(key) || 0;
      return {
        key,
        name: t(`sprint_status.${key.toLowerCase()}`, config.label),
        value: count,
        color: config.color,
      };
    });
  }, [rawData, t]);

  const totalSprints = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  const activeSprintCount = useMemo(
    () => chartData.find((d) => d.key === "ACTIVE")?.value || 0,
    [chartData]
  );

  return (
    <ChartWrapper
      title={t("widgets.sprint_status", "Tổng quan trạng thái Sprint")}
      description={t("charts.sprint_status_description", "Trạng thái hiện tại của tất cả sprint")}
      config={chartConfig}
      icon={<Zap className="h-4 w-4" />}
      footer={
        totalSprints > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Tổng Sprint:</span>
              <strong className="text-foreground font-mono">{totalSprints}</strong>
            </div>
            {activeSprintCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeSprintCount} sprint đang chạy
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium">
                Chưa có sprint đang chạy
              </span>
            )}
          </div>
        ) : null
      }
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 22, right: 12, left: 2, bottom: 0 }}
        barCategoryGap="15%"
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
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
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


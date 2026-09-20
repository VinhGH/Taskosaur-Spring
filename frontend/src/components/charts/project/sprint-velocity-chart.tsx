// components/charts/project/sprint-velocity-chart.tsx
import React, { useMemo } from "react";
import { formatDateForDisplay } from "@/utils/date";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { SprintVelocity } from "@/types/projects";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";

const chartConfig: ChartConfig = {
  velocity: { label: "Story Points", color: "#3B82F6" },
  average: { label: "Vận tốc TB", color: "#94A3B8" },
};

function formatSprintLabel(name: string, total: number): string {
  if (!name) return "";
  const match = name.match(/^(?:Sprint|Iteration|S)\s*#?(\d+)/i);
  if (match) {
    return total > 6 ? `S${match[1]}` : `Sprint ${match[1]}`;
  }
  const prefix = name.split(/[-:|]/)[0].trim();
  if (total > 6) {
    return prefix.length > 5 ? `${prefix.substring(0, 4)}…` : prefix;
  }
  return prefix.length > 10 ? `${prefix.substring(0, 8)}…` : prefix;
}

interface SprintVelocityChartProps {
  data: SprintVelocity[];
}

export function SprintVelocityChart({ data }: SprintVelocityChartProps) {
  const { t } = useTranslation(["analytics"]);

  const translatedConfig = useMemo<ChartConfig>(() => ({
    velocity: {
      label: t("charts.sprint_velocity_trend.story_points", "Story Points"),
      color: "#3B82F6",
    },
    average: {
      label: t("charts.sprint_velocity_trend.average_velocity", "Vận tốc TB"),
      color: "#94A3B8",
    },
  }), [t]);

  const rawData = data || [];
  const chartData = useMemo(() => {
    return rawData.map((sprint) => ({
      sprint: sprint.name || "Sprint",
      velocity: sprint.velocity || 0,
      date: sprint.startDate ? formatDateForDisplay(sprint.startDate) : t("na"),
    }));
  }, [rawData, t]);

  const averageVelocity = useMemo(() => {
    return chartData.length > 0
      ? Math.round(chartData.reduce((sum, item) => sum + item.velocity, 0) / chartData.length)
      : 0;
  }, [chartData]);

  const chartDataWithAverage = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      average: averageVelocity,
    }));
  }, [chartData, averageVelocity]);

  return (
    <ChartWrapper
      title={t("charts.sprint_velocity_trend.title", "Xu hướng vận tốc Sprint")}
      description={t("charts.sprint_velocity_trend.description", "Story points hoàn thành theo từng sprint")}
      config={translatedConfig}
      icon={<TrendingUp className="h-4 w-4" />}
      footer={
        chartData.length > 0 ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-3">
              <span>{translatedConfig.average.label}: <strong className="text-foreground font-mono">{averageVelocity} pts</strong></span>
              <span>Tổng sprint: <strong className="text-foreground font-mono">{chartData.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-[11px]">{translatedConfig.velocity.label}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-[#94A3B8]" />
                <span className="text-[11px]">{translatedConfig.average.label}</span>
              </span>
            </div>
          </div>
        ) : null
      }
    >
      {chartDataWithAverage.length > 0 ? (
        <LineChart
          accessibilityLayer
          data={chartDataWithAverage}
          margin={{ top: 15, right: 18, left: 2, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey="sprint"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            interval={0}
            padding={{ left: 20, right: 20 }}
            tickFormatter={(val: string) => formatSprintLabel(val, chartData.length)}
            tick={{ fill: "var(--foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            fontSize={11}
            width={34}
            tick={{ fill: "var(--muted-foreground)" }}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                className="bg-popover text-popover-foreground border-border shadow-md"
                labelFormatter={(label, payload) => {
                  const itemData = payload?.[0]?.payload;
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">{label}</span>
                      {itemData?.date && itemData.date !== t("na") && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {itemData.date}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="velocity"
            stroke="var(--color-velocity)"
            strokeWidth={2.5}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
            dot={{
              fill: "var(--color-velocity)",
              strokeWidth: 2,
              r: chartData.length > 8 ? 2.5 : 3.5,
              stroke: "var(--background)",
            }}
            activeDot={{
              r: chartData.length > 8 ? 4.5 : 5.5,
              fill: "var(--color-velocity)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--color-average)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[195px] text-muted-foreground text-xs italic">
          {t("charts.sprint_velocity_trend.no_sprints", "Chưa có sprint nào hoàn thành trong dự án này")}
        </div>
      )}
    </ChartWrapper>
  );
}


import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { useTranslation } from "react-i18next";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { FolderKanban } from "lucide-react";

const STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  PLANNING: { labelKey: "project_status.planning", color: "#8B5CF6" },
  ACTIVE: { labelKey: "project_status.active", color: "#10B981" },
  ON_HOLD: { labelKey: "project_status.on_hold", color: "#F59E0B" },
  COMPLETED: { labelKey: "project_status.completed", color: "#3B82F6" },
  CANCELLED: { labelKey: "project_status.cancelled", color: "#EF4444" },
};

interface ProjectPortfolioChartProps {
  data: Array<{ status: string; _count: { status: number } }>;
}

export function ProjectPortfolioChart({ data }: ProjectPortfolioChartProps) {
  const { t } = useTranslation("workspace-home");

  const chartConfig = useMemo(() => {
    return Object.entries(STATUS_CONFIG).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(val.labelKey),
        color: val.color,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>);
  }, [t]);

  const rawData = data || [];
  const chartData = useMemo(() => {
    return rawData.map((item) => {
      const statusKey = item?.status || "ACTIVE";
      const config = STATUS_CONFIG[statusKey] || { labelKey: statusKey, color: "#8B5CF6" };
      const count = item?._count?.status ?? (item as any)?.count ?? 0;
      return {
        key: statusKey,
        name: t(config.labelKey) || statusKey,
        value: count,
        fill: config.color,
      };
    });
  }, [rawData, t]);

  const totalProjects = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  // If no data or 0 total, provide a subtle placeholder ring
  const displayData = useMemo(() => {
    if (totalProjects === 0) {
      return [{ key: "EMPTY", name: t("analytics.no_analytics_data") || "Chưa có dự án", value: 1, fill: "var(--muted)" }];
    }
    return chartData.filter((item) => item.value > 0);
  }, [chartData, totalProjects, t]);

  return (
    <ChartWrapper
      title={t("widgets.project_status")}
      description={t("charts.project_status_description_with_count", { count: totalProjects })}
      config={chartConfig}
      icon={<FolderKanban className="h-4 w-4" />}
      footer={
        totalProjects > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {chartData
              .filter((item) => item.value > 0)
              .map((item) => {
                const percentage =
                  totalProjects > 0 ? Math.round((item.value / totalProjects) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border/50 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.name}:</span>
                    <span className="font-semibold text-foreground font-mono">{item.value}</span>
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
            totalProjects > 0 ? (
              <ChartTooltipContent hideLabel className="bg-popover text-popover-foreground border-border shadow-md" />
            ) : () => null
          }
        />
        <Pie
          data={displayData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={72}
          paddingAngle={totalProjects > 0 ? 3 : 0}
          strokeWidth={2}
          stroke="var(--background)"
          isAnimationActive={true}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {displayData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
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
                      {totalProjects.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 18}
                      className="fill-muted-foreground text-[11px] font-medium"
                    >
                      {t("kpi.total_projects") || "Dự án"}
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


// components/charts/workspace/project-status-chart.tsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { FolderKanban } from "lucide-react";

const chartConfig: ChartConfig = {
  PLANNING: { label: "Planning", color: "#8B5CF6" },
  ACTIVE: { label: "Active", color: "#10B981" },
  ON_HOLD: { label: "On Hold", color: "#F59E0B" },
  COMPLETED: { label: "Completed", color: "#3B82F6" },
  CANCELLED: { label: "Cancelled", color: "#EF4444" },
};

interface ProjectStatusChartProps {
  data: Array<{ status: string; _count: { status: number } }>;
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const { t } = useTranslation(["workspace-home", "projects"]);
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const rawData = data || [];
  const chartData = useMemo(() => {
    return rawData.map((item) => {
      const statusKey = item?.status || "PLANNING";
      const config = chartConfig[statusKey] || { label: statusKey, color: "#8B5CF6" };
      const count = item?._count?.status ?? (item as any)?.count ?? 0;
      return {
        id: statusKey,
        name: t(`projects:status.${statusKey.toLowerCase()}`, config.label as string || statusKey),
        value: count,
        color: config.color || "#8B5CF6",
      };
    });
  }, [rawData, t]);

  const totalProjects = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  const displayData = useMemo(() => {
    if (totalProjects === 0) {
      return [{ id: "EMPTY", name: t("no_data") || "Chưa có dự án", value: 1, color: "var(--muted)" }];
    }
    return chartData.filter((item) => item.value > 0);
  }, [chartData, totalProjects, t]);

  const handleClick = (entry: any) => {
    if (
      workspaceSlug &&
      typeof workspaceSlug === "string" &&
      /^[a-zA-Z0-9-]+$/.test(workspaceSlug) &&
      entry?.id &&
      entry.id !== "EMPTY"
    ) {
      router.push({
        pathname: "/[workspaceSlug]/projects",
        query: { workspaceSlug, statuses: entry.id },
      });
    }
  };

  return (
    <ChartWrapper
      title={t("widgets.project_status")}
      description={t("charts.project_status_description", "Current status breakdown of all projects")}
      config={chartConfig}
      icon={<FolderKanban className="h-4 w-4" />}
      footer={
        totalProjects > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {chartData
              .filter((item) => item.value > 0)
              .map((item) => {
                const percentage =
                  totalProjects > 0 ? Math.round((item.value / totalProjects) * 100) : 0;
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
            totalProjects > 0 ? (
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
          paddingAngle={totalProjects > 0 ? 3 : 0}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--background)"
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


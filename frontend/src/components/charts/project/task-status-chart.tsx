// components/charts/project/task-status-chart.tsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

interface StatusInfo {
  id: string;
  name: string;
  category: string;
  color: string;
  position: number;
}

interface TaskStatusChartData {
  statusId: string;
  count: number;
  status: StatusInfo;
}

interface TaskStatusChartProps {
  data: TaskStatusChartData[];
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const { t } = useTranslation(["analytics"]);
  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;

  const safeData = Array.isArray(data) ? data : [];
  const sortedData = useMemo(() => {
    return [...safeData].sort(
      (a, b) => (a.status?.position || 0) - (b.status?.position || 0)
    );
  }, [safeData]);

  const chartData = useMemo(() => {
    return sortedData.map((item) => {
      const status = item.status;
      return {
        id: item.statusId,
        name: status?.name || t("unknown", "Không xác định"),
        value: item.count || 0,
        color: status?.color || "#8B5CF6",
      };
    });
  }, [sortedData, t]);

  const totalTasks = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData]
  );

  const displayData = useMemo(() => {
    if (totalTasks === 0) {
      return [{ id: "EMPTY", name: t("no_data_available", "Chưa có công việc"), value: 1, color: "var(--muted)" }];
    }
    return chartData.filter((item) => item.value > 0);
  }, [chartData, totalTasks, t]);

  const handleClick = (entry: any) => {
    if (
      workspaceSlug &&
      typeof workspaceSlug === "string" &&
      /^[a-zA-Z0-9-]+$/.test(workspaceSlug) &&
      projectSlug &&
      typeof projectSlug === "string" &&
      /^[a-zA-Z0-9-]+$/.test(projectSlug) &&
      entry?.id &&
      entry.id !== "EMPTY"
    ) {
      router.push({
        pathname: "/[workspaceSlug]/[projectSlug]/tasks",
        query: { workspaceSlug, projectSlug, statuses: entry.id },
      });
    }
  };

  const chartConfig = useMemo<ChartConfig>(() => {
    return sortedData.reduce((config, item) => {
      if (item.status) {
        config[item.status.id] = {
          label: item.status.name,
          color: item.status.color,
        };
      }
      return config;
    }, {} as ChartConfig);
  }, [sortedData]);

  return (
    <ChartWrapper
      title={t("charts.task_status_flow.title", "Luồng trạng thái công việc")}
      description={t("charts.task_status_flow.description", "Phân bổ công việc hiện tại theo trạng thái")}
      config={chartConfig}
      icon={<CheckCircle2 className="h-4 w-4" />}
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


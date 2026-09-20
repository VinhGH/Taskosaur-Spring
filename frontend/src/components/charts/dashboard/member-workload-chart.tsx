// components/charts/dashboard/member-workload-chart.tsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useTranslation } from "react-i18next";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { Users, AlertTriangle } from "lucide-react";

interface MemberWorkloadChartProps {
  data: Array<{
    memberId: string;
    memberName: string;
    activeTasks: number;
    reportedTasks: number;
  }>;
}

export function MemberWorkloadChart({ data }: MemberWorkloadChartProps) {
  const { t } = useTranslation("workspace-home");

  const chartConfig = useMemo<ChartConfig>(() => ({
    activeTasks: {
      label: t("workload.assigned") || "Công việc được giao",
      color: "#3B82F6",
    },
    reportedTasks: {
      label: t("workload.reported") || "Công việc đã tạo",
      color: "#8B5CF6",
    },
  }), [t]);

  // Sort data by total tasks descending and filter to members with actual tasks (or top active)
  const rawData = data || [];
  const sortedData = useMemo(() => {
    return [...rawData]
      .filter((item) => (item?.activeTasks || 0) > 0 || (item?.reportedTasks || 0) > 0)
      .sort((a, b) => (b?.activeTasks || 0) + (b?.reportedTasks || 0) - ((a?.activeTasks || 0) + (a?.reportedTasks || 0)))
      .slice(0, 8); // Top 8 members to avoid overflow
  }, [rawData]);

  const chartData = useMemo(() => {
    return sortedData.map((item) => {
      const name = item.memberName || "Member";
      // Truncate name cleanly if too long
      const shortName = name.length > 12 ? `${name.substring(0, 11)}…` : name;
      return {
        memberId: item.memberId,
        memberName: name,
        shortName,
        activeTasks: item.activeTasks || 0,
        reportedTasks: item.reportedTasks || 0,
        total: (item.activeTasks || 0) + (item.reportedTasks || 0),
      };
    });
  }, [sortedData]);

  const highWorkloadCount = useMemo(() => {
    return sortedData.filter((item) => (item.activeTasks || 0) > 10).length;
  }, [sortedData]);

  const totalAssigned = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + (item.activeTasks || 0), 0);
  }, [sortedData]);

  return (
    <ChartWrapper
      title={t("widgets.member_workload")}
      description={t("charts.member_workload_description")}
      config={chartConfig}
      icon={<Users className="h-4 w-4" />}
      footer={
        sortedData.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-3">
              <span>
                {t("workload.assigned")}: <strong className="text-foreground font-mono">{totalAssigned}</strong>
              </span>
              <span>
                {t("analytics.kpi_cards.members")}: <strong className="text-foreground font-mono">{sortedData.length}</strong>
              </span>
            </div>
            {highWorkloadCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px]">
                <AlertTriangle className="h-3 w-3" />
                <span>{highWorkloadCount} thành viên quá tải (&gt;10 task)</span>
              </div>
            )}
          </div>
        ) : null
      }
    >
      {chartData.length === 0 ? (
        <div className="flex h-full min-h-[190px] items-center justify-center text-xs text-muted-foreground">
          {t("analytics.no_analytics_data") || "Chưa có dữ liệu công việc thành viên"}
        </div>
      ) : (
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 5, bottom: 0 }}
          barCategoryGap="18%"
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/30" />
          <YAxis
            dataKey="shortName"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            width={80}
            tick={{ fontSize: 11, fill: "var(--foreground)" }}
          />
          <XAxis type="number" hide />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.15 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                className="bg-popover text-popover-foreground border-border shadow-md"
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="activeTasks"
            fill="var(--color-activeTasks)"
            radius={[0, 4, 4, 0]}
            name={t("workload.assigned")}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="activeTasks"
              position="right"
              offset={6}
              className="fill-muted-foreground font-mono text-[11px]"
              formatter={(val: any) => (Number(val) > 0 ? val : "")}
            />
          </Bar>
          <Bar
            dataKey="reportedTasks"
            fill="var(--color-reportedTasks)"
            radius={[0, 4, 4, 0]}
            name={t("workload.reported")}
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="reportedTasks"
              position="right"
              offset={6}
              className="fill-muted-foreground font-mono text-[11px]"
              formatter={(val: any) => (Number(val) > 0 ? val : "")}
            />
          </Bar>
        </BarChart>
      )}
    </ChartWrapper>
  );
}


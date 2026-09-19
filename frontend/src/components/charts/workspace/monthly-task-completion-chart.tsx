import React, { useMemo } from "react";
import { formatDateForDisplay } from "@/utils/date";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";

const chartConfig: ChartConfig = {
  completion: { label: "Hoàn thành", color: "#3B82F6" },
};

interface MonthlyTaskCompletionChartProps {
  data: Array<{ month: string; count: number }>;
}

export function MonthlyTaskCompletionChart({ data }: MonthlyTaskCompletionChartProps) {
  const { t } = useTranslation(["workspace-home"]);

  const chartData = useMemo(() => {
    return (data || [])
      .map((item) => ({
        month: formatDateForDisplay(new Date(item.month + "-01"), {
          month: "short",
          year: "2-digit",
        }),
        completion: item.count,
      }))
      .reverse();
  }, [data]);

  const totalCompleted = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.completion || 0), 0),
    [chartData]
  );

  return (
    <ChartWrapper
      title={t("widgets.monthly_completion", "Hoàn thành công việc hàng tháng")}
      description={t("charts.monthly_completion_description", "Số lượng công việc hoàn thành mỗi tháng")}
      config={chartConfig}
      icon={<TrendingUp className="h-4 w-4" />}
      footer={
        totalCompleted > 0 ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Tổng hoàn thành: <strong className="text-foreground font-mono">{totalCompleted}</strong></span>
            <span className="text-[11px] text-emerald-500 font-medium">Theo dõi xu hướng</span>
          </div>
        ) : null
      }
    >
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 15, right: 18, left: 2, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          padding={{ left: 16, right: 16 }}
          tick={{ fill: "var(--foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          fontSize={11}
          width={32}
          tick={{ fill: "var(--muted-foreground)" }}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              hideLabel
              className="bg-popover text-popover-foreground border-border shadow-md"
            />
          }
        />
        <Line
          type="monotone"
          dataKey="completion"
          stroke="var(--color-completion)"
          strokeWidth={2.5}
          dot={{
            fill: "var(--color-completion)",
            strokeWidth: 2,
            r: 3.5,
            stroke: "var(--background)",
          }}
          activeDot={{
            r: 5,
            fill: "var(--color-completion)",
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ChartWrapper>
  );
}


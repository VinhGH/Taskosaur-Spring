// components/charts/dashboard/team-utilization-chart.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";
import { ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartWrapper } from "../chart-wrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/contexts/workspace-context";
import { useOrganization } from "@/contexts/organization-context";
import { ChartType } from "@/types";
import { ShieldCheck } from "lucide-react";

const ROLE_ORDER = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const;

const ROLE_META: Record<string, { labelKey: string; color: string }> = {
  ADMIN: { labelKey: "roles.admin", color: "#EF4444" },
  MANAGER: { labelKey: "roles.manager", color: "#F59E0B" },
  MEMBER: { labelKey: "roles.member", color: "#3B82F6" },
  VIEWER: { labelKey: "roles.viewer", color: "#10B981" },
};

interface TeamUtilizationChartProps {
  data: Array<{ role: string; _count: { role: number } }>;
}

export function TeamUtilizationChart({ data: initialData }: TeamUtilizationChartProps) {
  const { t } = useTranslation("workspace-home");
  const { workspaces, getWorkspacesByOrganization } = useWorkspace();
  const { fetchSingleChartData, currentOrganization } = useOrganization();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [rawData, setRawData] = useState<any[]>(initialData || []);

  useEffect(() => {
    if (currentOrganization?.id) {
      getWorkspacesByOrganization(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    setRawData(initialData || []);
  }, [initialData]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.entries(ROLE_META).reduce((acc, [key, val]) => {
      acc[key] = {
        label: t(val.labelKey),
        color: val.color,
      };
      return acc;
    }, {} as ChartConfig);
  }, [t]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    if (!currentOrganization) return;

    const filters = workspaceId === "all" ? {} : { workspaceId };
    const newData = await fetchSingleChartData(
      currentOrganization.id,
      ChartType.TEAM_UTILIZATION,
      filters
    );

    if (newData && !newData.error && Array.isArray(newData)) {
      setRawData(newData);
    }
  };

  const totalMembers = useMemo(() => {
    return (rawData || []).reduce((sum, item) => {
      const count = item?._count?.role ?? item?.count ?? 0;
      return sum + count;
    }, 0);
  }, [rawData]);

  const chartData = useMemo(() => {
    const roleCountMap = new Map<string, number>();
    (rawData || []).forEach((item: any) => {
      const roleKey = (item?.role || "").toUpperCase();
      const count = item?._count?.role ?? item?.count ?? 0;
      roleCountMap.set(roleKey, (roleCountMap.get(roleKey) || 0) + count);
    });

    return ROLE_ORDER.map((roleKey) => {
      const meta = ROLE_META[roleKey];
      const count = roleCountMap.get(roleKey) || 0;
      const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
      const label = t(meta.labelKey) || roleKey;
      return {
        key: roleKey,
        roleName: label,
        count,
        percentage,
        labelWithPercent: count > 0 ? `${count} (${percentage}%)` : "0 (0%)",
        fill: meta.color,
      };
    });
  }, [rawData, totalMembers, t]);

  const activeRolesCount = useMemo(() => {
    return chartData.filter((d) => d.count > 0).length;
  }, [chartData]);

  return (
    <ChartWrapper
      title={t("widgets.team_utilization")}
      description={
        selectedWorkspace === "all"
          ? t("charts.team_utilization_description_all")
          : t("charts.team_utilization_description_workspace")
      }
      config={chartConfig}
      icon={<ShieldCheck className="h-4 w-4" />}
      extraHeader={
        <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
          <SelectTrigger className="w-[145px] h-8 text-xs bg-background/50 border-border/70">
            <SelectValue placeholder={t("charts.all_workspaces")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("charts.all_workspaces")}</SelectItem>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{t("analytics.kpi_cards.members")}:</span>
            <strong className="text-foreground font-mono">{totalMembers}</strong>
            <span className="text-[11px]">({activeRolesCount} vai trò có nhân sự)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Phân quyền rõ ràng</span>
          </div>
        </div>
      }
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ top: 12, right: 55, left: 10, bottom: 5 }}
        barCategoryGap="25%"
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/30" />
        <YAxis
          dataKey="roleName"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={100}
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.15 }}
          content={
            <ChartTooltipContent
              hideLabel
              className="bg-popover text-popover-foreground border-border shadow-md"
            />
          }
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
          <LabelList
            dataKey="labelWithPercent"
            position="right"
            offset={8}
            className="fill-foreground font-mono font-semibold text-xs"
          />
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.key}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
}


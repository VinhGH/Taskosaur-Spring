import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: number | string | ReactNode;
  isLoading?: boolean;
  loadingPlaceholder?: ReactNode;
  statSuffix?: string | any; // e.g., "Active", "Total"
  className?: string;
  indicatorColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  isLoading = false,
  loadingPlaceholder = <span className="dashboard-loading-placeholder" />,
  statSuffix,
  className,
  indicatorColor = "bg-[var(--primary)]",
  iconBgColor = "bg-[var(--primary)]/10 text-[var(--primary)]",
}: StatCardProps) {
  return (
    <div className={`dashboard-stat-card transition-all duration-300 hover:translate-y-[-2px] ${className || ""}`}>
      <Card className="dashboard-stat-card-inner transition-all duration-300 hover:shadow-md hover:border-[var(--primary)]/40 group border border-[var(--border)] bg-[var(--card)] rounded-xl p-3.5 shadow-xs">
        <CardContent className="p-0 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-3.5 rounded-full ${indicatorColor} transition-all duration-300 group-hover:h-4`} />
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</h3>
            </div>
            {icon && (
              <div className={`size-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${iconBgColor}`}>
                {icon}
              </div>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              {isLoading ? loadingPlaceholder : value}
            </span>
            {statSuffix && <span className="text-xs text-[var(--muted-foreground)] font-medium">{statSuffix}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

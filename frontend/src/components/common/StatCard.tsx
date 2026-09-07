import { ReactNode } from "react";

export interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: number | string | ReactNode;
  isLoading?: boolean;
  loadingPlaceholder?: ReactNode;
  statSuffix?: string | any; // e.g., "Active", "Total"
  className?: string;
  indicatorColor?: string;
  iconBgColor?: string;
  cardBorderAccent?: string;
  cardGradient?: string;
  badge?: ReactNode;
  progress?: number;
  progressColor?: string;
  subtext?: ReactNode;
}

export function StatCard({
  icon,
  label,
  value,
  isLoading = false,
  loadingPlaceholder = <span className="dashboard-loading-placeholder" />,
  statSuffix,
  className,
  indicatorColor = "bg-primary",
  iconBgColor = "bg-primary/10 text-primary border border-primary/20",
  cardBorderAccent,
  cardGradient,
  badge,
  progress,
  progressColor = "bg-primary",
  subtext,
}: StatCardProps) {
  return (
    <div className={`dashboard-stat-card h-full transition-all duration-300 hover:-translate-y-1 ${className || ""}`}>
      <div
        className="taskosaur-stat-card group relative overflow-hidden rounded-xl p-3.5 flex flex-col justify-between h-full min-h-[118px]"
      >
        {/* Top Accent Color Bar */}
        {cardBorderAccent && (
          <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${cardBorderAccent}`} />
        )}

        {/* Subtle Ambient Background Gradient */}
        {cardGradient && (
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cardGradient} opacity-60 dark:opacity-25 transition-opacity duration-300 group-hover:opacity-90 dark:group-hover:opacity-40`}
          />
        )}

        <div className="p-0 relative z-10 flex flex-col justify-between flex-1 h-full">
          {/* Header Row: Indicator + Label + Icon */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={`w-1 h-3.5 rounded-full ${indicatorColor} transition-all duration-300 group-hover:h-4 flex-shrink-0`}
              />
              <h3 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {label}
              </h3>
            </div>
            {icon && (
              <div
                className={`size-6.5 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-2xs flex-shrink-0 ${iconBgColor}`}
              >
                {icon}
              </div>
            )}
          </div>

          {/* Value + Badge Row */}
          <div className="flex items-baseline justify-between gap-1.5 my-auto">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                {isLoading ? loadingPlaceholder : value}
              </span>
              {statSuffix && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {statSuffix}
                </span>
              )}
            </div>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>

          {/* Bottom Row: Progress Bar or Spacer to ensure pixel-perfect equal height */}
          <div className="mt-auto pt-2 w-full">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span className="truncate max-w-[75%]">{subtext || "\u00A0"}</span>
              {progress !== undefined ? (
                <span className="ml-auto font-semibold tabular-nums text-slate-700 dark:text-slate-300 flex-shrink-0">
                  {Math.min(Math.max(progress, 0), 100).toFixed(0)}%
                </span>
              ) : null}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
              {progress !== undefined ? (
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              ) : (
                <div className="h-full opacity-0" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

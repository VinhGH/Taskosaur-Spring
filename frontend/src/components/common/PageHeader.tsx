import { ReactNode } from "react";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ icon, title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 pb-2 border-b border-[var(--border)]/40 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-bold flex items-center gap-2 text-[var(--foreground)] truncate">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5 sm:mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

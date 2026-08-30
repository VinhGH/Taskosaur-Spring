import React, { ReactNode } from "react";
import { HiListBullet, HiViewColumns, HiCalendarDays } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TaskViewTabsProps {
  currentView: "list" | "kanban" | "gantt";
  onViewChange: (view: "list" | "kanban" | "gantt") => void;
  viewKanban?: boolean;
  viewGantt?: boolean;
  rightContent?: ReactNode;
}

export default function TabView({
  currentView,
  onViewChange,
  viewKanban = false,
  viewGantt = true,
  rightContent,
}: TaskViewTabsProps) {
  const { t } = useTranslation("tasks");
  const tabs = [
    { id: "list" as const, label: t("views.list"), icon: HiListBullet },
    ...(viewKanban ? [{ id: "kanban" as const, label: t("views.kanban"), icon: HiViewColumns }] : []),
    ...(viewGantt ? [{ id: "gantt" as const, label: t("views.gantt"), icon: HiCalendarDays }] : []),
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] bg-[var(--background)] gap-2 pb-1.5 sm:pb-0">
      <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none flex-nowrap shrink-0 py-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium relative transition-colors cursor-pointer whitespace-nowrap",
                isActive
                  ? "text-[var(--foreground)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {rightContent && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 pb-1 sm:pb-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}

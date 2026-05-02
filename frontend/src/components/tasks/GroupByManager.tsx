import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  LayoutList,
  CircleDot,
  Flame,
  Folder,
  User,
  Shapes,
  CalendarDays,
  CalendarClock,
  X,
} from "lucide-react";

import { HiCheckCircle } from "react-icons/hi2";
import type { GroupByField } from "@/types/tasks";
import Tooltip from "@/components/common/ToolTip";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface GroupFieldConfig {
  value: GroupByField;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const GROUP_FIELD_OPTIONS: GroupFieldConfig[] = [
  {
    value: "status",
    label: "Status",
    description: "Group by task status",
    icon: CircleDot,
    color: "text-blue-500",
  },
  {
    value: "priority",
    label: "Priority",
    description: "Group by priority level",
    icon: Flame,
    color: "text-orange-500",
  },
  {
    value: "project",
    label: "Project",
    description: "Group by project",
    icon: Folder,
    color: "text-green-500",
  },
  {
    value: "assignee",
    label: "Assignee",
    description: "Group by assigned member",
    icon: User,
    color: "text-purple-500",
  },
  {
    value: "type",
    label: "Task Type",
    description: "Group by task type",
    icon: Shapes,
    color: "text-pink-500",
  },
  {
    value: "dueDate",
    label: "Due Date",
    description: "Group by due date",
    icon: CalendarDays,
    color: "text-red-500",
  },
  {
    value: "createdAt",
    label: "Created Date",
    description: "Group by creation date",
    icon: CalendarClock,
    color: "text-teal-500",
  },
];


const STORAGE_KEY = "tasks_group_by";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GroupByManagerProps {
  groupBy: GroupByField;
  onGroupByChange: (field: GroupByField) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GroupByManager: React.FC<GroupByManagerProps> = ({
  groupBy,
  onGroupByChange,
}) => {
  const [open, setOpen] = useState(false);

  // Persist selection
  const handleSelect = useCallback(
    (field: GroupByField) => {
      onGroupByChange(field);
      localStorage.setItem(STORAGE_KEY, field);
      setOpen(false);
    },
    [onGroupByChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSelect("none");
    },
    [handleSelect]
  );

  const activeConfig =
    groupBy !== "none"
      ? GROUP_FIELD_OPTIONS.find((f) => f.value === groupBy) ?? null
      : null;

  const ActiveIcon = activeConfig?.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip content="Group tasks" position="top" color="primary">
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`border-[var(--border)] cursor-pointer flex items-center gap-1.5 transition-all ${
              activeConfig
                ? "border-[var(--primary)]/50 bg-[var(--primary)]/8 text-[var(--primary)]"
                : ""
            }`}
          >
            {ActiveIcon ? (
              <>
                <ActiveIcon className={`!w-[15px] !h-[15px] ${activeConfig?.color ?? ""}`} />
                <span className="text-xs font-medium hidden sm:inline max-w-[80px] truncate">
                  {activeConfig?.label}
                </span>
                {/* Clear button */}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear group by"
                  onClick={handleClear}
                  onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
                  className="ml-0.5 rounded-full hover:bg-[var(--destructive)]/20 p-0.5 cursor-pointer"
                >
                  <X className="!w-[10px] !h-[10px]" />
                </span>
              </>
            ) : (
              <LayoutList className="!w-[15px] !h-[15px] text-[var(--foreground)]" />
            )}
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-64 bg-[var(--card)] border-[var(--border)]"
      >
        <DropdownMenuLabel className="text-xs font-semibold flex justify-between items-center">
          <span className="flex items-center gap-2">
            <LayoutList className="w-3.5 h-3.5" />
            Group By
          </span>
          {activeConfig && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs flex items-center gap-1 text-[var(--muted-foreground)]"
              onClick={() => handleSelect("none")}
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </DropdownMenuLabel>

        <div className="px-2 pb-1 text-xs text-[var(--muted-foreground)]">
          Organise tasks into logical groups
        </div>

        <DropdownMenuSeparator />

        <div className="py-1">
          {GROUP_FIELD_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = groupBy === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`my-0.5 cursor-pointer justify-between py-2.5 px-3 rounded-md mx-1 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)]/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${option.color}`} />
                  <div>
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {option.description}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <HiCheckCircle className="w-4 h-4 text-[var(--primary)] animate-in zoom-in-50 duration-200 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        {/* "No Grouping" option */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSelect("none")}
          className={`my-0.5 cursor-pointer py-2 px-3 rounded-md mx-1 mb-1 ${
            groupBy === "none"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "hover:bg-[var(--accent)]/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutList className="w-4 h-4 text-[var(--muted-foreground)]" />
            <div>
              <div className="text-xs font-medium">No Grouping</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                Show as flat list
              </div>
            </div>
          </div>
          {groupBy === "none" && (
            <HiCheckCircle className="w-4 h-4 text-[var(--primary)] ml-auto" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { GROUP_FIELD_OPTIONS, STORAGE_KEY as GROUP_BY_STORAGE_KEY };
export default GroupByManager;

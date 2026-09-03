import React from "react";
import { CardContent } from "@/components/ui/card";
import { HiChatBubbleLeft, HiCalendarDays, HiPaperClip } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getRelativeDateLabel, isDateOverdue as checkDateOverdue } from "@/utils/date";

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  taskNumber: number;
  assignees?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }>;
  reporters?: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  subtaskCount?: number;
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  isArchived?: boolean;
}

interface TaskCardProps {
  task: KanbanTask;
  statusId: string;
  isDragging: boolean;
  onDragStart: (task: KanbanTask, statusId: string) => void;
  onDragEnd: () => void;
  onClick?: (task: KanbanTask) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "HIGHEST":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#eab308";
    case "LOW":
      return "#22c55e";
    case "LOWEST":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

const getCategoryFromDescription = (description?: string) => {
  if (!description) return { name: "Task", color: "#6b7280" };

  const desc = description.toLowerCase();
  if (desc.includes("development") || desc.includes("code") || desc.includes("api")) {
    return { name: "Development", color: "#3b82f6" };
  }
  if (desc.includes("design") || desc.includes("ui") || desc.includes("ux")) {
    return { name: "Design", color: "#10b981" };
  }
  if (desc.includes("writing") || desc.includes("content")) {
    return { name: "UX Writing", color: "#f59e0b" };
  }
  return { name: "Task", color: "#6b7280" };
};

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
};

const formatDueDate = (dueDate: string) => {
  return getRelativeDateLabel(dueDate);
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  statusId,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const isOverdue = task.dueDate ? checkDateOverdue(task.dueDate, task.completedAt) : false;
  const category = getCategoryFromDescription(task.description);
  const priorityColor = getPriorityColor(task.priority);

  // Handle click with proper event handling
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    e.stopPropagation();

    // Call onClick if provided
    if (onClick) {
      onClick(task);
    }
  };

  // Handle drag start with click prevention
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    onDragStart(task, statusId);
  };

  // Get assignees - support both old (single assignee) and new (assignees array) format
  const assignees = task.assignees || [];
  const hasAssignees = assignees.length > 0;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className={cn(
        "rounded-lg border mb-2 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-xs hover:border-[var(--primary)]/50 group/card",
        isDragging && "opacity-50 rotate-1 shadow-md",
        onClick && "hover:cursor-pointer"
      )}
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <CardContent className="p-3">
        {/* Task Title */}
        <div className="flex items-start gap-1.5 mb-2">
          <h4
            className="text-xs sm:text-[13px] font-medium leading-snug line-clamp-2 flex-1 group-hover/card:text-[var(--primary)] transition-colors"
            style={{ color: "var(--foreground)" }}
            title={task.title}
          >
            {task.title}
          </h4>
          {task.isArchived && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex-shrink-0">
              Archived
            </span>
          )}
        </div>

        {/* Priority & Meta & Assignees in Compact Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/30">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Badge */}
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: `${priorityColor}18`,
                color: priorityColor,
                border: `1px solid ${priorityColor}35`,
              }}
            >
              {task.priority}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  isOverdue ? "text-red-500 font-medium" : "text-[var(--muted-foreground)]"
                )}
              >
                <HiCalendarDays size={12} className={isOverdue ? "text-red-500" : "text-[var(--muted-foreground)]"} />
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}

            {/* Comment Count */}
            {task.commentCount && task.commentCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <HiChatBubbleLeft size={12} />
                <span>{task.commentCount}</span>
              </div>
            )}

            {/* Subtask Count */}
            {task.subtaskCount && task.subtaskCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <HiPaperClip size={12} />
                <span>{task.subtaskCount}</span>
              </div>
            )}
          </div>

          {/* Right side - Assignee Avatars */}
          {hasAssignees && (
            <div className="flex items-center -space-x-1.5 shrink-0">
              {assignees.slice(0, 3).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium border-2 border-[var(--card)]"
                  style={{
                    backgroundColor: priorityColor,
                    color: "var(--primary-foreground)",
                    zIndex: assignees.length - index,
                  }}
                  title={`${assignee.firstName} ${assignee.lastName}`}
                >
                  {assignee.avatar ? (
                    <Image
                      src={assignee.avatar}
                      alt={`${assignee.firstName} ${assignee.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                      height={20}
                      width={20}
                    />
                  ) : (
                    getInitials(assignee.firstName, assignee.lastName)
                  )}
                </div>
              ))}

              {assignees.length > 3 && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium border-2 border-[var(--card)] bg-[var(--muted)] text-[var(--muted-foreground)]"
                  title={`${assignees.length - 3} more assignees`}
                >
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default TaskCard;

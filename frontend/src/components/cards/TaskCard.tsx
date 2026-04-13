import React from "react";
import { formatDateForDisplay } from "@/utils/date";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconButton } from "@/components/ui/IconButton";
import { PriorityBadge } from "@/components/badges/PriorityBadge";
import { HiClock, HiDotsVertical } from "react-icons/hi";

interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  statusId: string;
  dueDate: string;
  projectId: string;
  slug: string;
}

interface TaskCardProps {
  task: Task;
  workspaceSlug: string;
  projectSlug: string;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  workspaceSlug,
  projectSlug,
  className,
}) => {
  return (
    <Link href={`/${workspaceSlug}/${projectSlug}/tasks/${task.slug}`}>
      <Card className={`group ${className}`}>
        <CardHeader className="taskcard-header">
          <div className="taskcard-header-content">
            <div className="taskcard-main-content">
              <CardTitle>
                <span className="taskcard-title">{task.title}</span>
              </CardTitle>
              <PriorityBadge priority={task.priority} />
            </div>
            <IconButton icon={<HiDotsVertical size={12} />} size="xs" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="taskcard-due-date">
            <HiClock size={12} className="taskcard-due-icon" />
            Due {formatDateForDisplay(task.dueDate)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

import { useState, useEffect, useCallback } from "react";
import TaskTable from "@/components/ui/tables/TaskTable";
import { ColumnConfig, Task } from "@/types";

interface TaskListViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  projectsOfCurrentWorkspace?: any[];
  onTaskRefetch?: () => void;
  columns?: ColumnConfig[];
  showAddTaskRow?: boolean;
  addTaskPriorities?: any[];
  addTaskStatuses?: any[];
  projectMembers?: any[];
  workspaceMembers?: any[];
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
  onTasksSelect?: (taskIds: string[], action: "add" | "remove" | "set") => void;
  showBulkActionBar?: boolean;
  totalTask?: number;
  search?: string;
  selectedStatuses?: string[];
  selectedPriorities?: string[];
  selectedTaskTypes?: string[];
  selectedAssignees?: string[];
  selectedReporters?: string[];
  sprintId?: string;
  workspaceId?: string;
}

export default function TaskListView({
  tasks,
  workspaceSlug,
  projectSlug,
  projects,
  projectsOfCurrentWorkspace,
  onTaskRefetch,
  columns,
  showAddTaskRow,
  addTaskStatuses,
  projectMembers,
  workspaceMembers,
  selectedTasks: externalSelectedTasks,
  onTaskSelect: externalOnTaskSelect,
  onTasksSelect: externalOnTasksSelect,
  showBulkActionBar,
  totalTask,
  search,
  selectedStatuses,
  selectedPriorities,
  selectedTaskTypes,
  selectedAssignees,
  selectedReporters,
  sprintId,
  workspaceId,
}: TaskListViewProps) {
  const [internalSelectedTasks, setInternalSelectedTasks] = useState<string[]>([]);
  
  // Use external selected tasks if provided, otherwise use internal state
  const selectedTasks = externalSelectedTasks ?? internalSelectedTasks;

  // Sync internal state with external props if they change
  useEffect(() => {
    if (externalSelectedTasks !== undefined) {
      setInternalSelectedTasks(externalSelectedTasks);
    }
  }, [externalSelectedTasks]);

  const handleTaskSelect = useCallback((taskId: string) => {
    if (externalOnTaskSelect) {
      externalOnTaskSelect(taskId);
    } else {
      setInternalSelectedTasks((prev) =>
        prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      );
    }
  }, [externalOnTaskSelect]);

  const handleTasksSelect = useCallback(
    (taskIds: string[], action: "add" | "remove" | "set") => {
      if (externalOnTasksSelect) {
        externalOnTasksSelect(taskIds, action);
      } else if (externalOnTaskSelect && externalSelectedTasks !== undefined) {
        // Fallback: If parent provided individual task selection but not bulk, loop through them
        // This ensures parent state is updated even if bulk handler is missing
        taskIds.forEach((taskId) => {
          const isSelected = (externalSelectedTasks || []).includes(taskId);
          if (action === "set") {
            // Clearing selection
            if (taskIds.length === 0 && isSelected) {
              externalOnTaskSelect(taskId);
            }
          } else if (action === "add" && !isSelected) {
            externalOnTaskSelect(taskId);
          } else if (action === "remove" && isSelected) {
            externalOnTaskSelect(taskId);
          }
        });
      } else {
        setInternalSelectedTasks((prev) => {
          if (action === "set") return taskIds;
          if (action === "add") {
            const newIds = taskIds.filter((id) => !prev.includes(id));
            return [...prev, ...newIds];
          }
          if (action === "remove") {
            return prev.filter((id) => !taskIds.includes(id));
          }
          return prev;
        });
      }
    },
    [externalOnTasksSelect, externalOnTaskSelect, externalSelectedTasks]
  );

  return (
    <div className="rounded-md">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground"></div>
      </div>
      <TaskTable
        tasks={tasks}
        workspaceSlug={workspaceSlug}
        projectSlug={projectSlug}
        projects={projects}
        projectsOfCurrentWorkspace={projectsOfCurrentWorkspace}
        showProject={!projectSlug}
        columns={columns}
        onTaskRefetch={onTaskRefetch}
        showAddTaskRow={showAddTaskRow}
        addTaskStatuses={addTaskStatuses}
        projectMembers={projectMembers}
        workspaceMembers={workspaceMembers}
        selectedTasks={selectedTasks}
        onTaskSelect={handleTaskSelect}
        onTasksSelect={handleTasksSelect}
        showBulkActionBar={showBulkActionBar}
        totalTask={totalTask}
        search={search}
        selectedStatuses={selectedStatuses}
        selectedPriorities={selectedPriorities}
        selectedTaskTypes={selectedTaskTypes}
        selectedAssignees={selectedAssignees}
        selectedReporters={selectedReporters}
        sprintId={sprintId}
        workspaceId={workspaceId}
      />
    </div>
  );
}

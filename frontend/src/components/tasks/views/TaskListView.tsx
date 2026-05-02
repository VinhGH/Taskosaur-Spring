import { useState, useEffect, useCallback } from "react";
import TaskTable from "@/components/ui/tables/TaskTable";
import { ColumnConfig, Task } from "@/types";
import type { GroupByField, GroupState } from "@/types/tasks";


interface TaskListViewProps {
  tasks: Task[];
  workspaceSlug?: string;
  projectSlug?: string;
  projects?: any[];
  projectsOfCurrentWorkspace?: any[];
  onTaskRefetch?: () => Promise<void> | void;
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
  organizationId?: string;
  currentProject?: any;
  /** Active group-by field */
  groupBy?: GroupByField;
  onGroupByChange?: (field: GroupByField) => void;
  /** Backend-driven group state (from useGroupedTasks hook) */
  groupMap?: Map<string, GroupState>;
  onGroupPageChange?: (groupKey: string, page: number) => void;
  groupedLoading?: boolean;
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
  currentProject,
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
  organizationId,
  groupBy = "none",
  onGroupByChange,
  groupMap,
  onGroupPageChange,
  groupedLoading = false,
}: TaskListViewProps) {

  const [internalSelectedTasks, setInternalSelectedTasks] = useState<string[]>([]);

  const selectedTasks = externalSelectedTasks ?? internalSelectedTasks;

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
        taskIds.forEach((taskId) => {
          const isSelected = (externalSelectedTasks || []).includes(taskId);
          if (action === "set") {
            if (taskIds.length === 0 && isSelected) externalOnTaskSelect(taskId);
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
          if (action === "remove") return prev.filter((id) => !taskIds.includes(id));
          return prev;
        });
      }
    },
    [externalOnTasksSelect, externalOnTaskSelect, externalSelectedTasks]
  );

  return (
    <div className="rounded-md">
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
        organizationId={organizationId}
        currentProject={currentProject}
        groupBy={groupBy}
        groupMap={groupMap}
        onGroupPageChange={onGroupPageChange}
        groupedLoading={groupedLoading}
      />
    </div>
  );
}

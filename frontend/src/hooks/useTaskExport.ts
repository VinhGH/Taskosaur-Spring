import { useState, useCallback } from "react";
import { Task, ColumnConfig } from "@/types";
import {
  exportTasksToCSV,
  exportTasksToPDF,
  exportTasksToXLSX,
  exportTasksToJSON,
} from "@/utils/exportUtils";
import { taskApi } from "@/utils/api/taskApi";
import { TokenManager } from "@/lib/api";
import { toast } from "sonner";

export type ExportFormat = "csv" | "xlsx" | "json" | "pdf";
export type ExportScope = "all" | "current_page" | "selected";

export interface UseTaskExportOptions {
  tasks: Task[];
  columns?: ColumnConfig[];
  projectName?: string;
  projectId?: string;
  workspaceId?: string;
  organizationId?: string;
  sprintId?: string;
  filters?: {
    statuses?: string;
    priorities?: string;
    types?: string;
    search?: string;
    assignees?: string;
    reporters?: string;
  };
  selectedTaskIds?: string[];
}

export interface ExportExecutionOptions {
  scope?: ExportScope;
  selectedColumnIds?: string[];
  includeSummarySheet?: boolean;
}

export function useTaskExport({
  tasks,
  columns = [],
  projectName,
  projectId,
  workspaceId,
  organizationId,
  sprintId,
  filters,
  selectedTaskIds = [],
}: UseTaskExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchTasksForExport = useCallback(
    async (scope: ExportScope): Promise<Task[]> => {
      // 1. Selected tasks scope
      if (scope === "selected") {
        if (!selectedTaskIds || selectedTaskIds.length === 0) {
          return tasks;
        }
        const selectedMap = new Set(selectedTaskIds);
        const filtered = tasks.filter((t) => selectedMap.has(t.id));
        return filtered.length > 0 ? filtered : tasks;
      }

      // 2. Current page scope
      if (scope === "current_page") {
        return tasks;
      }

      // 3. All matching tasks scope (fetch from backend)
      const orgId = organizationId || TokenManager.getCurrentOrgId() || localStorage.getItem("currentOrganizationId");
      if (!orgId) {
        return tasks;
      }

      try {
        const response = await taskApi.getAllTasks(orgId, {
          projectId,
          workspaceId,
          sprintId,
          statuses: filters?.statuses,
          priorities: filters?.priorities,
          types: filters?.types,
          search: filters?.search,
          assignees: filters?.assignees,
          reporters: filters?.reporters,
          page: 1,
          limit: 2000,
        });

        const allFetchedTasks = Array.isArray(response)
          ? response
          : (response as any)?.data || [];

        return allFetchedTasks.length > 0 ? allFetchedTasks : tasks;
      } catch (error) {
        console.warn("Failed to fetch all tasks for export, falling back to current page:", error);
        return tasks;
      }
    },
    [tasks, selectedTaskIds, organizationId, projectId, workspaceId, sprintId, filters]
  );

  const handleExport = useCallback(
    async (
      format: ExportFormat = "xlsx",
      options: ExportExecutionOptions = {}
    ) => {
      const scope = options.scope || (selectedTaskIds.length > 0 ? "selected" : "all");
      const dateStr = new Date().toISOString().split("T")[0];
      const prefix = projectName
        ? `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_tasks`
        : "tasks_report";
      const filename = `${prefix}_${dateStr}.${format}`;

      setIsExporting(true);
      const toastId = toast.loading(`Đang khởi tạo báo cáo ${format.toUpperCase()}...`);

      try {
        const exportTasksList = await fetchTasksForExport(scope);

        if (!exportTasksList || exportTasksList.length === 0) {
          toast.error("Không có công việc nào để xuất.", { id: toastId });
          return;
        }

        const commonOptions = {
          showProject: !projectId,
          projectName: projectName || "Taskosaur Project",
          includeSummarySheet: options.includeSummarySheet !== false,
          selectedColumnIds: options.selectedColumnIds,
        };

        if (format === "csv") {
          exportTasksToCSV(exportTasksList, columns, filename, commonOptions);
        } else if (format === "xlsx") {
          exportTasksToXLSX(exportTasksList, columns, filename, commonOptions);
        } else if (format === "json") {
          exportTasksToJSON(exportTasksList, columns, filename, commonOptions);
        } else {
          exportTasksToPDF(exportTasksList, columns, filename, commonOptions);
        }

        toast.success(`Đã xuất thành công ${exportTasksList.length} công việc (${format.toUpperCase()})!`, {
          id: toastId,
        });
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại!", { id: toastId });
      } finally {
        setIsExporting(false);
      }
    },
    [fetchTasksForExport, projectName, projectId, columns, selectedTaskIds]
  );

  return {
    handleExport,
    isExporting,
    isExportModalOpen,
    setIsExportModalOpen,
  };
}

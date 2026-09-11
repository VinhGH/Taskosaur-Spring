import { useCallback } from "react";
import { Task, ColumnConfig } from "@/types";
import {
  exportTasksToCSV,
  exportTasksToPDF,
  exportTasksToXLSX,
  exportTasksToJSON,
} from "@/utils/exportUtils";

interface UseTaskExportOptions {
  tasks: Task[];
  columns: ColumnConfig[];
  projectName?: string;
}

export function useTaskExport({ tasks, columns, projectName }: UseTaskExportOptions) {
  const handleExport = useCallback(
    (format: "csv" | "pdf" | "xlsx" | "json" = "csv") => {
      const dateStr = new Date().toISOString().split("T")[0];
      const prefix = projectName
        ? `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_tasks`
        : "tasks_export";
      const filename = `${prefix}_${dateStr}.${format}`;

      if (format === "csv") {
        exportTasksToCSV(tasks, columns, filename, {
          showProject: true,
        });
      } else if (format === "xlsx") {
        exportTasksToXLSX(tasks, columns, filename, {
          showProject: true,
        });
      } else if (format === "json") {
        exportTasksToJSON(tasks, columns, filename, {
          showProject: true,
        });
      } else {
        exportTasksToPDF(tasks, columns, filename, {
          showProject: true,
        });
      }
    },
    [columns, tasks, projectName]
  );

  return { handleExport };
}

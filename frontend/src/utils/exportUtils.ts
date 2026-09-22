import dayjs from "dayjs";
import { Task, ColumnConfig } from "@/types";
import * as XLSX from "xlsx";

export interface ExportColumnOption {
  id: string;
  label: string;
  defaultSelected?: boolean;
}

export const REPORT_EXPORT_COLUMNS: ExportColumnOption[] = [
  { id: "taskKey", label: "Task Key", defaultSelected: true },
  { id: "title", label: "Title", defaultSelected: true },
  { id: "type", label: "Type", defaultSelected: true },
  { id: "status", label: "Status", defaultSelected: true },
  { id: "priority", label: "Priority", defaultSelected: true },
  { id: "project", label: "Project", defaultSelected: true },
  { id: "sprint", label: "Sprint", defaultSelected: true },
  { id: "assignees", label: "Assignees", defaultSelected: true },
  { id: "reporter", label: "Reporter", defaultSelected: true },
  { id: "storyPoints", label: "Story Points", defaultSelected: true },
  { id: "startDate", label: "Start Date", defaultSelected: false },
  { id: "dueDate", label: "Due Date", defaultSelected: true },
  { id: "completedAt", label: "Completed Date", defaultSelected: true },
  { id: "createdAt", label: "Created Date", defaultSelected: false },
  { id: "labels", label: "Labels", defaultSelected: false },
  { id: "description", label: "Description", defaultSelected: true },
];

/**
 * Strip HTML tags and entities to clean plain text for spreadsheet export
 */
export function stripHtmlToPlainText(html?: string | null): string {
  if (!html) return "";
  let text = String(html);
  // Replace line breaks and paragraph/list tags with newlines
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<\/h[1-6]>/gi, "\n");
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Unescape common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  // Normalize whitespace
  return text.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
}

/**
 * Helper function to get columns for export (with deduplication)
 */
export function getExportColumns(
  columns: ColumnConfig[] = [],
  options: {
    showProject?: boolean;
    selectedColumnIds?: string[];
  } = {}
): ColumnConfig[] {
  const { showProject = false, selectedColumnIds } = options;

  // If specific column IDs are chosen by user in export modal
  if (selectedColumnIds && selectedColumnIds.length > 0) {
    const selectedSet = new Set(selectedColumnIds);
    return REPORT_EXPORT_COLUMNS.filter((col) => selectedSet.has(col.id)).map((col) => ({
      id: col.id,
      label: col.label,
      visible: true,
    }));
  }

  // Deduplicate columns by id
  const columnMap = new Map<string, ColumnConfig>();

  // Always include key report columns first
  columnMap.set("taskKey", { id: "taskKey", label: "Task Key", visible: true });
  columnMap.set("title", { id: "title", label: "Task", visible: true });
  if (showProject) {
    columnMap.set("project", { id: "project", label: "Project", visible: true });
  }
  columnMap.set("type", { id: "type", label: "Type", visible: true });
  columnMap.set("status", { id: "status", label: "Status", visible: true });
  columnMap.set("priority", { id: "priority", label: "Priority", visible: true });
  columnMap.set("assignees", { id: "assignees", label: "Assignees", visible: true });
  columnMap.set("dueDate", { id: "dueDate", label: "Due Date", visible: true });
  columnMap.set("storyPoints", { id: "storyPoints", label: "Story Points", visible: true });
  columnMap.set("completedAt", { id: "completedAt", label: "Completed Date", visible: true });

  // Add any additional visible columns from the current view that aren't already included
  if (Array.isArray(columns)) {
    for (const col of columns) {
      if (col && col.visible && col.id) {
        if (!columnMap.has(col.id)) {
          columnMap.set(col.id, col);
        }
      }
    }
  }

  return Array.from(columnMap.values());
}

/**
 * Helper function to extract task data for export
 */
export function extractTaskData(task: Task, columnId: string): any {
  switch (columnId) {
    case "taskKey":
    case "taskNumber": {
      const prefix = task.project?.taskPrefix;
      if (prefix && task.taskNumber) {
        return `${prefix}-${task.taskNumber}`;
      }
      return task.taskNumber ? `#${task.taskNumber}` : "";
    }

    case "title":
      return task.title || "";

    case "type":
      return task.type || "TASK";

    case "status":
      return task.status?.name || (task as any).statusId || "";

    case "priority":
      return task.priority || "MEDIUM";

    case "project":
      return task.project?.name || "";

    case "sprint":
      return task.sprint?.name || "";

    case "assignees":
      if (task.assignees && task.assignees.length > 0) {
        return task.assignees
          .map((u) => {
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
            return name || u.email || "User";
          })
          .join(", ");
      }
      return "Unassigned";

    case "reporter":
      if (task.reporter) {
        const name = `${task.reporter.firstName || ""} ${task.reporter.lastName || ""}`.trim();
        return name || task.reporter.email || "";
      }
      return task.createdBy || "";

    case "storyPoints":
      return task.storyPoints ?? 0;

    case "startDate":
      return task.startDate ? dayjs(task.startDate).format("YYYY-MM-DD") : "";

    case "dueDate":
      return task.dueDate ? dayjs(task.dueDate).format("YYYY-MM-DD") : "";

    case "completedAt":
      return task.completedAt ? dayjs(task.completedAt).format("YYYY-MM-DD") : "";

    case "createdAt":
      return task.createdAt ? dayjs(task.createdAt).format("YYYY-MM-DD HH:mm") : "";

    case "updatedAt":
      return task.updatedAt ? dayjs(task.updatedAt).format("YYYY-MM-DD HH:mm") : "";

    case "timeline":
      if (task.startDate && task.dueDate) {
        return `${dayjs(task.startDate).format("YYYY-MM-DD")} - ${dayjs(task.dueDate).format("YYYY-MM-DD")}`;
      } else if (task.startDate) {
        return `${dayjs(task.startDate).format("YYYY-MM-DD")} - TBD`;
      } else if (task.dueDate) {
        return `TBD - ${dayjs(task.dueDate).format("YYYY-MM-DD")}`;
      }
      return "-";

    case "labels":
      if (Array.isArray((task as any).labels) && (task as any).labels.length > 0) {
        return (task as any).labels.map((l: any) => l.name || l).join(", ");
      }
      return "";

    case "description":
      return stripHtmlToPlainText(task.description);

    case "originalEstimate":
      return task.originalEstimate ?? 0;

    case "remainingEstimate":
      return task.remainingEstimate ?? 0;

    case "parentTask":
      return task.parentTask ? task.parentTask.title || (task.parentTask.taskNumber ? `#${task.parentTask.taskNumber}` : "") : "";

    case "childTasksCount":
      return task._count?.childTasks ?? task.childTasks?.length ?? 0;

    case "commentsCount":
      return task._count?.comments ?? task.comments?.length ?? 0;

    case "attachmentsCount":
      return task._count?.attachments ?? task.attachments?.length ?? 0;

    case "timeEntries":
      return task.timeEntries?.length ?? 0;

    default: {
      const val = (task as any)[columnId];
      if (typeof val === "string" || typeof val === "number") return val;
      return "";
    }
  }
}

/**
 * Export tasks to CSV format with UTF-8 BOM for Excel compatibility
 */
export const exportTasksToCSV = (
  tasks: Task[],
  columns: ColumnConfig[],
  filename = "tasks_export.csv",
  options: {
    showProject?: boolean;
    selectedColumnIds?: string[];
  } = {}
) => {
  try {
    const allExportColumns = getExportColumns(columns, options);
    if (allExportColumns.length === 0) return;

    // Create header row
    const headers = allExportColumns.map((col) => col.label);

    // Create data rows
    const rows = tasks.map((task) =>
      allExportColumns.map((col) => {
        const cellValue = extractTaskData(task, col.id);
        const stringValue = cellValue === null || cellValue === undefined ? "" : String(cellValue);
        const escapedValue = stringValue.replace(/"/g, '""');
        if (escapedValue.search(/("|,|\n|\r)/g) >= 0) {
          return `"${escapedValue}"`;
        }
        return escapedValue;
      })
    );

    // Combine header and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows properly displays Vietnamese diacritics
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to export tasks to CSV:", error);
    throw error;
  }
};

/**
 * Creates executive summary dashboard worksheet for Excel export
 */
function createSummarySheet(tasks: Task[], projectName?: string) {
  const total = tasks.length;
  const completed = tasks.filter(
    (t) =>
      Boolean(t.completedAt) ||
      t.status?.name?.toLowerCase() === "done" ||
      (t.status as any)?.category === "DONE"
  ).length;
  const inProgress = tasks.filter(
    (t) =>
      t.status?.name?.toLowerCase().includes("progress") ||
      (t.status as any)?.category === "IN_PROGRESS"
  ).length;
  const pending = Math.max(0, total - completed - inProgress);
  const completionRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  // Priority breakdown
  const priorityCounts: Record<string, number> = {};
  // Assignee breakdown
  const assigneeCounts: Record<string, number> = {};

  tasks.forEach((t) => {
    const s = t.status?.name || "No Status";
    statusCounts[s] = (statusCounts[s] || 0) + 1;

    const p = t.priority || "MEDIUM";
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;

    const assignees =
      t.assignees && t.assignees.length > 0
        ? t.assignees
            .map((u) => `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email)
            .join(", ")
        : "Unassigned";
    assigneeCounts[assignees] = (assigneeCounts[assignees] || 0) + 1;
  });

  const summaryData: any[][] = [
    ["TASKOSAUR - BÁO CÁO CÔNG VIỆC THỰC TẾ (WORK REPORT)"],
    ["Dự án / Workspace:", projectName || "Tất cả công việc"],
    ["Thời gian xuất:", dayjs().format("YYYY-MM-DD HH:mm:ss")],
    [],
    ["CHỈ SỐ TỔNG QUAN (KEY METRICS)", "GIÁ TRỊ"],
    ["Tổng số công việc (Total Tasks)", total],
    ["Đã hoàn thành (Completed)", completed],
    ["Đang thực hiện (In Progress)", inProgress],
    ["Chờ xử lý / Khác (Pending / Others)", pending],
    ["Tỷ lệ hoàn thành (Completion Rate)", completionRate],
    ["Tổng Story Points", totalStoryPoints],
    [],
    ["PHÂN BỔ THEO TRẠNG THÁI (STATUS)", "SỐ LƯỢNG", "TỶ LỆ"],
    ...Object.entries(statusCounts).map(([status, count]) => [
      status,
      count,
      total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
    ]),
    [],
    ["PHÂN BỔ THEO ĐỘ ƯU TIÊN (PRIORITY)", "SỐ LƯỢNG", "TỶ LỆ"],
    ...Object.entries(priorityCounts).map(([priority, count]) => [
      priority,
      count,
      total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
    ]),
    [],
    ["PHÂN BỔ THEO THÀNH VIÊN THỰC HIỆN (ASSIGNEE)", "SỐ LƯỢNG CÔNG VIỆC"],
    ...Object.entries(assigneeCounts).map(([assignee, count]) => [assignee, count]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  ws["!cols"] = [{ wch: 45 }, { wch: 25 }, { wch: 18 }];
  return ws;
}

/**
 * Export tasks to Excel (.xlsx) format with summary report dashboard
 */
export const exportTasksToXLSX = (
  tasks: Task[],
  columns: ColumnConfig[],
  filename = "tasks_export.xlsx",
  options: {
    showProject?: boolean;
    projectName?: string;
    includeSummarySheet?: boolean;
    selectedColumnIds?: string[];
  } = {}
) => {
  try {
    const { projectName, includeSummarySheet = true } = options;
    const allExportColumns = getExportColumns(columns, options);

    if (allExportColumns.length === 0) {
      return;
    }

    // Create header row
    const headers = allExportColumns.map((col) => col.label);

    // Create data rows
    const rows = tasks.map((task) =>
      allExportColumns.map((col) => extractTaskData(task, col.id))
    );

    // Combine header and rows
    const data = [headers, ...rows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths (auto-size based on content)
    const colWidths = allExportColumns.map((col) => {
      const maxWidth = 40;
      const headerWidth = col.label.length;
      const maxDataWidth = Math.min(
        maxWidth,
        Math.max(
          ...tasks.slice(0, 100).map((task) => {
            const value = extractTaskData(task, col.id);
            return value ? String(value).length : 0;
          }),
          0
        )
      );
      return { wch: Math.max(headerWidth, maxDataWidth, 10) };
    });
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Append Summary Sheet first if requested
    if (includeSummarySheet) {
      const summarySheet = createSummarySheet(tasks, projectName);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Report");
    }

    // Append Detail Tasks Sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

    // Generate and download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error("Failed to export tasks to XLSX:", error);
    throw error;
  }
};

/**
 * Export tasks to JSON format
 */
export const exportTasksToJSON = (
  tasks: Task[],
  columns: ColumnConfig[],
  filename = "tasks_export.json",
  options: {
    showProject?: boolean;
    pretty?: boolean;
    selectedColumnIds?: string[];
  } = {}
) => {
  try {
    const { pretty = true } = options;
    const allExportColumns = getExportColumns(columns, options);

    if (allExportColumns.length === 0) {
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      columns: allExportColumns.map((col) => col.label),
      tasks: tasks.map((task) => {
        const taskData: Record<string, any> = {};
        allExportColumns.forEach((col) => {
          taskData[col.label] = extractTaskData(task, col.id);
        });
        return taskData;
      }),
    };

    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to export tasks to JSON:", error);
    throw error;
  }
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Export tasks to printable HTML / PDF
 */
export const exportTasksToPDF = (
  tasks: Task[],
  columns: ColumnConfig[],
  filename = "tasks_export.pdf",
  options: {
    showProject?: boolean;
    selectedColumnIds?: string[];
  } = {}
) => {
  try {
    const safeFilename = filename.replace(/[^\w.\- ]+/g, "_");
    const allExportColumns = getExportColumns(columns, options);

    if (allExportColumns.length === 0) {
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safeFilename}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: 600; }
          tr:nth-child(even) { background-color: #f8fafc; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
          @media print {
            @page { margin: 1cm; size: landscape; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Taskosaur - Báo cáo công việc</h1>
        <div class="meta">Thời gian xuất: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} • Tổng số công việc: ${tasks.length}</div>
        <table>
          <thead>
            <tr>
              ${allExportColumns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (task) => `
              <tr>
                ${allExportColumns
                  .map((col) => `<td>${escapeHtml(String(extractTaskData(task, col.id) ?? ""))}</td>`)
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      try {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } catch (error) {
        console.error("Failed to write PDF content:", error);
      }
    }
  } catch (error) {
    console.error("Failed to export tasks to PDF:", error);
    throw error;
  }
};

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  FileCode,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { REPORT_EXPORT_COLUMNS, ExportColumnOption } from "@/utils/exportUtils";
import { ExportFormat, ExportScope, ExportExecutionOptions } from "@/hooks/useTaskExport";

interface ExportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportExecutionOptions) => Promise<void>;
  isExporting: boolean;
  totalTasksCount?: number;
  currentPageTasksCount?: number;
  selectedCount?: number;
  projectName?: string;
}

export const ExportTasksModal: React.FC<ExportTasksModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  totalTasksCount = 0,
  currentPageTasksCount = 0,
  selectedCount = 0,
  projectName,
}) => {
  const { t } = useTranslation("tasks");

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xlsx");
  const [selectedScope, setSelectedScope] = useState<ExportScope>(() =>
    selectedCount > 0 ? "selected" : "all"
  );
  const [includeSummarySheet, setIncludeSummarySheet] = useState(true);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);

  // Selected column IDs
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() =>
    REPORT_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.id)
  );

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnIds(REPORT_EXPORT_COLUMNS.map((c) => c.id));
  };

  const handleResetColumns = () => {
    setSelectedColumnIds(
      REPORT_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.id)
    );
  };

  const handleSubmitExport = async () => {
    await onExport(selectedFormat, {
      scope: selectedScope,
      selectedColumnIds,
      includeSummarySheet,
    });
    onClose();
  };

  const formats: Array<{
    id: ExportFormat;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: "xlsx",
      label: "Excel (.xlsx)",
      sublabel: t("exportModal.excelDesc", "Kèm Dashboard tổng hợp KPI • Khuyên dùng"),
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: t("exportModal.recommendedBadge", "Khuyên dùng"),
    },
    {
      id: "csv",
      label: "CSV (.csv)",
      sublabel: t("exportModal.csvDesc", "Chuẩn UTF-8 BOM • Mở hoàn hảo trên Excel"),
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      id: "pdf",
      label: "Báo cáo In / PDF",
      sublabel: t("exportModal.pdfDesc", "Tài liệu bảng biểu định dạng A4 ngang"),
      icon: <Printer className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: "json",
      label: "JSON (.json)",
      sublabel: t("exportModal.jsonDesc", "Dữ liệu cấu trúc dành cho lập trình viên"),
      icon: <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExporting && !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[var(--background)] border-[var(--border)]">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">
                {t("exportModal.title", "Xuất báo cáo công việc")}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {projectName ? `${projectName} • ` : ""}
                {t("exportModal.subtitle", "Xuất dữ liệu chi tiết và bảng tổng hợp phục vụ báo cáo")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format selection */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {t("exportModal.chooseFormat", "1. Chọn định dạng tệp")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-[var(--border)] hover:bg-[var(--accent)]/50"
                    }`}
                  >
                    <div className="mt-0.5">{fmt.icon}</div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {fmt.label}
                        </span>
                        {fmt.badge && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            {fmt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                        {fmt.sublabel}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope selection */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {t("exportModal.chooseScope", "2. Phạm vi dữ liệu")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope("all")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  selectedScope === "all"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-[var(--border)] hover:bg-[var(--accent)]/40 text-[var(--foreground)]"
                }`}
              >
                <span className="text-xs">{t("exportModal.scopeAll", "Tất cả công việc")}</span>
                <span className="text-[11px] opacity-70 mt-0.5">
                  ({totalTasksCount > 0 ? totalTasksCount : "Toàn bộ"} tasks)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScope("current_page")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  selectedScope === "current_page"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-[var(--border)] hover:bg-[var(--accent)]/40 text-[var(--foreground)]"
                }`}
              >
                <span className="text-xs">{t("exportModal.scopePage", "Trang hiện tại")}</span>
                <span className="text-[11px] opacity-70 mt-0.5">
                  ({currentPageTasksCount} tasks)
                </span>
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setSelectedScope("selected")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  selectedCount === 0
                    ? "opacity-40 cursor-not-allowed border-[var(--border)]"
                    : selectedScope === "selected"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-[var(--border)] hover:bg-[var(--accent)]/40 text-[var(--foreground)]"
                }`}
              >
                <span className="text-xs">{t("exportModal.scopeSelected", "Đang chọn")}</span>
                <span className="text-[11px] opacity-70 mt-0.5">
                  ({selectedCount} tasks)
                </span>
              </button>
            </div>
          </div>

          {/* Options */}
          {selectedFormat === "xlsx" && (
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummarySheet}
                  onCheckedChange={(checked) => setIncludeSummarySheet(Boolean(checked))}
                />
                <Label
                  htmlFor="includeSummary"
                  className="text-xs font-medium cursor-pointer text-[var(--foreground)]"
                >
                  {t(
                    "exportModal.includeSummarySheet",
                    "Thêm trang Báo cáo tổng hợp KPI (Summary Dashboard Sheet)"
                  )}
                </Label>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] pl-6">
                {t(
                  "exportModal.summaryNote",
                  "Bao gồm bảng tổng hợp tỷ lệ hoàn thành, tổng Story Points, phân bổ theo trạng thái và thành viên."
                )}
              </p>
            </div>
          )}

          {/* Column checklist customization */}
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowColumnsConfig(!showColumnsConfig)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--accent)]/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {t("exportModal.customizeColumns", "Tùy chỉnh cột xuất dữ liệu")}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                  {selectedColumnIds.length}/{REPORT_EXPORT_COLUMNS.length} cột
                </span>
              </div>
              {showColumnsConfig ? (
                <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
              )}
            </button>

            {showColumnsConfig && (
              <div className="p-4 pt-2 border-t border-[var(--border)] bg-[var(--background)] space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--border)]/60">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllColumns}
                      className="text-primary hover:underline text-[11px]"
                    >
                      {t("exportModal.selectAll", "Chọn tất cả")}
                    </button>
                    <span className="text-[var(--muted-foreground)]">•</span>
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      className="text-[var(--muted-foreground)] hover:underline text-[11px]"
                    >
                      {t("exportModal.resetDefault", "Mặc định")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {REPORT_EXPORT_COLUMNS.map((col) => {
                    const isChecked = selectedColumnIds.includes(col.id);
                    return (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleColumn(col.id)}
                        />
                        <label
                          htmlFor={`col-${col.id}`}
                          className="text-xs cursor-pointer select-none text-[var(--foreground)]"
                        >
                          {col.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t border-[var(--border)] bg-[var(--muted)]/20 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExporting}
          >
            {t("exportModal.cancel", "Hủy")}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmitExport}
            disabled={isExporting || selectedColumnIds.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("exportModal.exporting", "Đang xuất báo cáo...")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t("exportModal.submit", "Xuất file")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

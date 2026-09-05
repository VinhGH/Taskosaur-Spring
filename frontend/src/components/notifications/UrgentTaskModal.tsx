import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  HiBellAlert,
  HiExclamationTriangle,
  HiXMark,
  HiArrowTopRightOnSquare,
  HiCheck,
} from "react-icons/hi2";

interface UrgentTaskModalProps {
  isOpen: boolean;
  notification: any | null;
  onClose: () => void;
}

export const UrgentTaskModal: React.FC<UrgentTaskModalProps> = ({
  isOpen,
  notification,
  onClose,
}) => {
  const router = useRouter();

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !notification) {
    return null;
  }

  const actionUrl = notification.actionUrl || "";

  const handleNavigate = () => {
    onClose();
    if (actionUrl) {
      const target = actionUrl.startsWith("http")
        ? new URL(actionUrl).pathname
        : actionUrl;
      router.push(target);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="urgent-task-title"
      aria-describedby="urgent-task-desc"
    >
      <div className="relative w-full max-w-lg bg-[var(--card)] border-2 border-red-500/50 rounded-3xl shadow-2xl shadow-red-950/60 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Dramatic Gradient & Beacon */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-28 h-28 bg-red-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition focus:outline-none"
            aria-label="Đóng cảnh báo"
          >
            <HiXMark className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center flex-shrink-0 shadow-inner">
              <HiBellAlert className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Khẩn cấp • Ưu tiên cao nhất</span>
              </div>
              <h2 id="urgent-task-title" className="text-xl font-bold tracking-tight text-white mt-1">
                Cảnh báo công việc khẩn cấp
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Highlight Task Box */}
          <div className="bg-[var(--muted)]/50 border border-[var(--border)] rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 block mb-1">
              {notification.title || "Công việc ưu tiên CAO NHẤT"}
            </span>
            <p id="urgent-task-desc" className="text-base font-semibold text-[var(--foreground)] leading-snug">
              {notification.message || "Bạn có công việc khẩn cấp mới cần xử lý ngay lập tức!"}
            </p>
          </div>

          {/* Prompt banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-red-900 dark:text-red-200 text-xs sm:text-sm">
            <HiExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn đã được giao phụ trách hoặc công việc được chuyển sang mức <strong>CAO NHẤT (HIGHEST)</strong>. Vui lòng nhận và xử lý ngay!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-[var(--border)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] font-medium"
          >
            <HiCheck className="w-4 h-4 mr-1.5" />
            Đã hiểu
          </Button>

          {actionUrl && (
            <Button
              onClick={handleNavigate}
              className="w-full sm:flex-1 h-11 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>Xem & Nhận task ngay</span>
              <HiArrowTopRightOnSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrgentTaskModal;

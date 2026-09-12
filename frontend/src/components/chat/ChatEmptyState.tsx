import React from "react";
import { HiSparkles } from "react-icons/hi2";
import {
  Plus,
  ListTodo,
  CheckCircle2,
  Calendar,
  UserCheck,
} from "lucide-react";

interface ChatEmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = React.memo(
  ({ onSelectPrompt }) => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[var(--muted)] max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center shadow-md">
            <HiSparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5 tracking-tight">
            Hi! I'm your Taskosaur AI Assistant
          </h3>
          <p className="text-xs sm:text-sm mb-4 text-gray-500 dark:text-gray-400">
            I can help you manage tasks, projects, and workspaces
          </p>
          <div className="text-left bg-gray-50/90 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5 text-gray-500 dark:text-gray-400">
              Try these commands:
            </p>
            <ul className="text-xs space-y-2 text-gray-700 dark:text-gray-300 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "Create a task called [name]"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "Show high priority tasks"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "Mark [task] as done"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "Create a workspace called [name]"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "List my projects"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                "Navigate to [workspace] workspace"
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/60 mt-3.5">
              <button
                type="button"
                onClick={() => onSelectPrompt("Tạo task 'Thiết kế trang thanh toán' độ ưu tiên HIGH")}
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200/80 hover:border-blue-300 bg-blue-50/90 hover:bg-blue-100/90 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 font-medium transition-all shadow-xs group"
              >
                <span className="size-5 rounded-md flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span>Tạo task mẫu</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPrompt("Liệt kê các task trong dự án này")}
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200/80 hover:border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-300 font-medium transition-all shadow-xs group"
              >
                <span className="size-5 rounded-md flex items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
                  <ListTodo className="w-3.5 h-3.5" />
                </span>
                <span>Liệt kê task</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPrompt("Setup dự án từ ngày 01/10/2026 đến ngày 31/12/2026")}
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-purple-200/80 hover:border-purple-300 bg-purple-50/90 hover:bg-purple-100/90 text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 dark:text-purple-300 font-medium transition-all shadow-xs group"
              >
                <span className="size-5 rounded-md flex items-center justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/60 transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <span>Setup ngày dự án</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPrompt("Tạo task 'Thiết kế database' giao cho Vinh")}
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-sky-200/80 hover:border-sky-300 bg-sky-50/90 hover:bg-sky-100/90 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 dark:text-sky-300 font-medium transition-all shadow-xs group"
              >
                <span className="size-5 rounded-md flex items-center justify-center bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/60 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" />
                </span>
                <span>Giao task thành viên</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPrompt("Chuyển task sang DONE")}
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200/80 hover:border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 font-medium transition-all shadow-xs group"
              >
                <span className="size-5 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span>Đổi sang DONE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ChatEmptyState.displayName = "ChatEmptyState";

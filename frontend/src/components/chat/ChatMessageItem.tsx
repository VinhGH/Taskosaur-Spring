import React from "react";
import { formatDateTimeForDisplay } from "@/utils/date";
import { HiSparkles } from "react-icons/hi2";
import {
  Plus,
  ListTodo,
  CheckCircle2,
  ArrowRightLeft,
  Zap,
  Trash2,
  Circle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Brain,
  Calendar,
  UserCheck,
  UserPlus,
  Clock,
  Copy,
  Check,
  Undo2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, formatUserDisplayMessage } from "./types";

interface ChatMessageItemProps {
  message: Message;
  index: number;
  user: any;
  copiedIndex: number | null;
  onCopyMessage: (content: string, index: number) => void;
  onRollbackMessage: (index: number) => void;
  onToggleThoughtExpanded: (index: number) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(
  ({
    message,
    index,
    user,
    copiedIndex,
    onCopyMessage,
    onRollbackMessage,
    onToggleThoughtExpanded,
  }) => {
    return (
      <div className="group">
        {message.role === "user" ? (
          // User Message - Right aligned
          <div className="flex justify-end mb-4 group/userMsg">
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="flex flex-col items-end">
                <div className="bg-[#1E2939] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {formatUserDisplayMessage(message.content)}
                  </div>
                </div>
                {/* Action Buttons: Copy & Rollback */}
                <div className="flex items-center gap-0.5 mt-1 pr-1 opacity-60 group-hover/userMsg:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onCopyMessage(message.content, index)}
                    title={copiedIndex === index ? "Đã sao chép" : "Sao chép tin nhắn"}
                    className="p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRollbackMessage(index)}
                    title="Rollback lại tin nhắn này để chỉnh sửa"
                    className="p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1E2939] text-sm font-medium flex-shrink-0 shadow-xs border border-gray-100 dark:border-transparent">
                {user?.firstName?.[0]?.toUpperCase() +
                  user?.lastName?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
        ) : message.role === "system" ? (
          // System Message - Centered
          <div className="flex justify-center mb-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm max-w-[90%]">
              {message.content}
            </div>
          </div>
        ) : (
          // Assistant Message - Left aligned
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center flex-shrink-0">
                <HiSparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm space-y-2 flex-1">
                {/* Antigravity-style Problem Solving Process & Audit Logs */}
                {message.steps && message.steps.length > 0 && (
                  <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden bg-white/70 dark:bg-gray-900/60 transition-all shadow-xs">
                    <button
                      type="button"
                      onClick={() => onToggleThoughtExpanded(index)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          Quá trình giải quyết ({message.steps.filter((s) => s.status === "completed").length}/{message.steps.length} bước hoàn tất)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <span className="text-[11px] font-mono">
                          {message.isThoughtExpanded ? "Thu gọn" : "Chi tiết"}
                        </span>
                        {message.isThoughtExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {message.isThoughtExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-2.5 text-xs">
                        {/* Steps List */}
                        <div className="space-y-1.5 pt-1">
                          {message.steps.map((st, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2">
                              {st.status === "completed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : st.status === "failed" ? (
                                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 leading-tight">
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {st.title}
                                </span>
                                {st.detail && (
                                  <span className="ml-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                    - {st.detail}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Audit Logs Console */}
                        {message.logs && message.logs.length > 0 && (
                          <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-950 dark:bg-black font-mono text-[11px]">
                            <div className="flex items-center justify-between px-2.5 py-1 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Terminal className="w-3 h-3 text-gray-400" />
                                <span className="font-semibold text-gray-300">Nhật ký thực thi hệ thống (Audit Log)</span>
                              </div>
                              <span className="text-emerald-400 text-[10px]">Exit Code 0 (Success)</span>
                            </div>
                            <div className="p-2.5 max-h-36 overflow-y-auto space-y-1 text-emerald-400/90 chat-input-scrollbar">
                              {message.logs.map((log, lIdx) => (
                                <div key={lIdx} className="leading-snug break-all">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-900 dark:text-gray-100 break-words leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-gray-950 dark:text-white bg-blue-50/70 dark:bg-blue-900/30 px-1 py-0.5 rounded text-[13px] border border-blue-200/50 dark:border-blue-700/40">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => (
                        <code className="px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700/60 font-mono text-[12px] text-pink-600 dark:text-pink-400">
                          {children}
                        </code>
                      ),
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline hover:no-underline font-medium"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse rounded" />
                  )}
                </div>

                {/* Action Confirmation Cards */}
                {message.actions && message.actions.length > 0 && (
                  <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-1.5">
                    {message.actions.map((act, actIdx) => (
                      <div
                        key={actIdx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800/80 text-xs text-gray-900 dark:text-gray-100 shadow-xs flex-wrap"
                      >
                        {act.action === "CREATE_TASK" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-[11px]">
                              <Plus className="w-3 h-3" />
                              <span>ĐÃ TẠO</span>
                            </span>
                            <span className="font-semibold text-blue-700 dark:text-blue-300">
                              {act.taskSlug}
                            </span>
                            <span className="truncate flex-1 font-medium text-gray-800 dark:text-gray-200">{act.title}</span>
                            {act.assignee && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40">
                                <UserCheck className="w-3 h-3" />
                                @{act.assigneeUsername || act.assignee}
                              </span>
                            )}
                            {act.reporter && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40">
                                <UserPlus className="w-3 h-3" />
                                báo cáo: @{act.reporterUsername || act.reporter}
                              </span>
                            )}
                            {act.dueDate && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                <Clock className="w-3 h-3" />
                                {act.dueDate}
                              </span>
                            )}
                            {act.priority && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent">
                                {act.priority}
                              </span>
                            )}
                          </>
                        )}
                        {act.action === "SETUP_PROJECT_DATES" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-[11px]">
                              <Calendar className="w-3 h-3" />
                              <span>DỰ ÁN</span>
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {act.projectName || "Dự án"}
                            </span>
                            <span className="text-gray-400">Thời hạn:</span>
                            <span className="font-bold text-blue-700 dark:text-blue-400">
                              {act.startDate || "Chưa đặt"} → {act.endDate || "Chưa đặt"}
                            </span>
                          </>
                        )}
                        {act.action === "ASSIGN_TASK" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                              <UserCheck className="w-3 h-3" />
                              <span>PHÂN CÔNG</span>
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{act.taskSlug}</span>
                            {act.assignee && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                Giao cho: @{act.assigneeUsername || act.assignee}
                              </span>
                            )}
                            {act.reporter && (
                              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                                (Báo cáo: @{act.reporterUsername || act.reporter})
                              </span>
                            )}
                          </>
                        )}
                        {act.action === "UPDATE_STATUS" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>TRẠNG THÁI</span>
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{act.taskSlug}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {act.newStatus}
                            </span>
                          </>
                        )}
                        {act.action === "UPDATE_PRIORITY" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold text-[11px]">
                              <Zap className="w-3 h-3" />
                              <span>ƯU TIÊN</span>
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{act.taskSlug}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-bold text-purple-700 dark:text-purple-400">
                              {act.priority}
                            </span>
                          </>
                        )}
                        {act.action === "DELETE_TASK" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-[11px]">
                              <Trash2 className="w-3 h-3" />
                              <span>ĐÃ XÓA</span>
                            </span>
                            <span className="font-semibold line-through text-rose-700 dark:text-rose-300">
                              {act.taskSlug}
                            </span>
                          </>
                        )}
                        {act.action === "LIST_TASKS" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px]">
                              <ListTodo className="w-3 h-3" />
                              <span>DANH SÁCH</span>
                            </span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              Tìm thấy {act.count} công việc phù hợp
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Copy & Rollback */}
                {!message.isStreaming && (
                  <div className="flex items-center gap-0.5 pt-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onCopyMessage(message.content, index)}
                      title={copiedIndex === index ? "Đã sao chép" : "Sao chép câu trả lời"}
                      className="p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRollbackMessage(index)}
                      title="Rollback câu trả lời & chỉnh sửa câu hỏi"
                      className="p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Timestamp - appears on hover */}
        {message.timestamp && (
          <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-2 mb-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDateTimeForDisplay(message.timestamp, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
      </div>
    );
  }
);

ChatMessageItem.displayName = "ChatMessageItem";

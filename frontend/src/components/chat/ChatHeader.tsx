import React from "react";
import { HiXMark, HiSparkles, HiArrowPath, HiBars3, HiPlus } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

interface ChatHeaderProps {
  onOpenHistory: () => void;
  onNewChat: () => void;
  onClearContext: () => void;
  onClearChat: () => void;
  onCloseChat: () => void;
  hasMessages: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  ({
    onOpenHistory,
    onNewChat,
    onClearContext,
    onClearChat,
    onCloseChat,
    hasMessages,
  }) => {
    const { t } = useTranslation("chat");

    return (
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-[var(--border)] bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur shadow-xs z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
            title={t("aiAssistant.viewHistory", "View Chat History")}
          >
            <HiBars3 className="w-5 h-5" />
          </button>
          <button
            onClick={onNewChat}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
            title={t("aiAssistant.newChat", "New Chat")}
          >
            <HiPlus className="w-5 h-5" />
          </button>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <HiSparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
            {t("aiAssistant.title", "AI Assistant")}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Context Clear Button */}
          <button
            onClick={onClearContext}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-md transition-all duration-200"
            title={t("aiAssistant.clearContext", "Clear Current Chat Context")}
          >
            <HiArrowPath className="w-3 h-3" />
            <span>{t("aiAssistant.context", "Context")}</span>
          </button>
          {hasMessages && (
            <button
              onClick={onClearChat}
              className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all duration-200"
              title={t("aiAssistant.clearChat", "Clear")}
            >
              {t("aiAssistant.clearChat", "Clear")}
            </button>
          )}
          <button
            onClick={onCloseChat}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-500 transition-all duration-200 ml-1 shadow-sm"
            title={t("aiAssistant.close", "Close AI Assistant (Esc)")}
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);

ChatHeader.displayName = "ChatHeader";

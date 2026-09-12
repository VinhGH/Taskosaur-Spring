import React from "react";
import { HiXMark, HiPlus, HiChatBubbleLeft, HiPencil, HiTrash } from "react-icons/hi2";
import { Conversation } from "@/lib/mcp-server";

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string;
  editingId: string | null;
  editTitle: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onStartRename: (id: string, title: string) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onChangeEditTitle: (val: string) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = React.memo(
  ({
    isOpen,
    onClose,
    conversations,
    currentConversationId,
    editingId,
    editTitle,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onStartRename,
    onSaveRename,
    onCancelRename,
    onChangeEditTitle,
  }) => {
    return (
      <>
        {/* Sidebar Overlay */}
        {isOpen && (
          <div
            className="absolute inset-0 bg-black/45 z-30 transition-opacity duration-200"
            onClick={onClose}
          />
        )}

        {/* Sidebar Content */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-[280px] bg-[var(--background)] border-r border-[var(--border)] z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-primary">Chat History</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[var(--accent)] transition-colors duration-200"
            >
              <HiXMark className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-[var(--border)] flex-shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
            >
              <HiPlus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 chatgpt-scrollbar">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  conv.id === currentConversationId
                    ? "bg-[var(--accent)] text-primary font-medium"
                    : "hover:bg-[var(--accent)]/65 text-[var(--muted-foreground)]"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HiChatBubbleLeft className="w-4 h-4 flex-shrink-0 text-blue-500" />
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => onChangeEditTitle(e.target.value)}
                      onBlur={() => onSaveRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveRename(conv.id);
                        if (e.key === "Escape") onCancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[var(--accent)] border border-blue-500 rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-primary"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm truncate">{conv.title}</span>
                  )}
                </div>

                {editingId !== conv.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRename(conv.id, conv.title);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[var(--muted-foreground)] hover:text-primary transition-colors"
                      title="Rename"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
);

ChatHistoryDrawer.displayName = "ChatHistoryDrawer";

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import ChatLayout from './ChatLayout';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Minus, Maximize2 } from 'lucide-react';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { currentWorkspace, workspaces } = useWorkspace();
  const { isAuthenticated } = useAuth();

  // Resilient workspace resolution: use currentWorkspace, or matched from localStorage, or first workspace
  const activeWorkspace = useMemo(() => {
    if (currentWorkspace) return currentWorkspace;
    if (!workspaces || workspaces.length === 0) return null;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('currentWorkspaceId');
      if (storedId) {
        const found = workspaces.find((w) => w.id === storedId);
        if (found) return found;
      }
    }
    return workspaces[0];
  }, [currentWorkspace, workspaces]);

  if (!isAuthenticated() || !activeWorkspace) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Floating Toggle Button - Present on all tabs */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-all p-0 flex items-center justify-center ring-4 ring-blue-500/20"
          title="Mở trung tâm trò chuyện (Chat Hub)"
        >
          <MessageSquare size={20} />
        </Button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-[#161822] border border-gray-200/90 dark:border-neutral-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ring-1 ring-black/5 dark:ring-white/5 ${
            isMinimized
              ? 'w-72 h-10'
              : 'w-[420px] md:w-[860px] lg:w-[920px] h-[580px] md:h-[620px] max-h-[90vh] max-w-[96vw]'
          }`}
        >
          {/* Header Bar */}
          <div className="h-10 px-3 bg-gray-50 dark:bg-[#1a1d27] border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white truncate pr-2">
              <MessageSquare size={13} className="text-blue-500 shrink-0" />
              <span className="truncate">Trò chuyện • {activeWorkspace.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-neutral-800/60 transition-colors"
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-gray-500 hover:text-red-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-neutral-800/60 transition-colors"
                title="Đóng cửa sổ chat"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <div className="flex-1 min-h-0 h-full overflow-hidden">
              <ChatLayout
                workspaceId={activeWorkspace.id}
                isHubMode={true}
                className="border-0 rounded-none shadow-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

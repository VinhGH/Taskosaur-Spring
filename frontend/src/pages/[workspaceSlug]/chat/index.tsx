import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWorkspace } from '@/contexts/workspace-context';
import ChatLayout from '@/components/chat/ChatLayout';
import { MessageSquare } from 'lucide-react';

export default function WorkspaceChatPage() {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { currentWorkspace, getWorkspaceBySlug, isLoading } = useWorkspace();
  const [workspace, setWorkspace] = useState<any>(currentWorkspace || null);
  const [loading, setLoading] = useState(!currentWorkspace);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    const scrollParent = containerRef.current?.closest('.overflow-y-scroll');
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorkspace = async () => {
      if (!router.isReady || !workspaceSlug) return;

      if (currentWorkspace && currentWorkspace.slug === workspaceSlug) {
        setWorkspace(currentWorkspace);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const ws = await getWorkspaceBySlug(workspaceSlug as string);
        if (isMounted && ws) {
          setWorkspace(ws);
        }
      } catch (err) {
        console.error('Failed to load workspace for chat:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, workspaceSlug, currentWorkspace, getWorkspaceBySlug]);

  const activeWorkspace = workspace || currentWorkspace;

  return (
    <>
      <Head>
        <title>
          Trò chuyện - {activeWorkspace ? activeWorkspace.name : 'Workspace'} | Taskosaur
        </title>
      </Head>

      <div
        ref={containerRef}
        className="h-[calc(100vh-140px)] md:h-[calc(100vh-135px)] flex flex-col p-1 sm:p-2 max-w-[1700px] mx-auto overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                Kênh Trò Chuyện Không Gian Làm Việc
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Trao đổi, chia sẻ tệp và cộng tác giữa các đội ngũ trong không gian {activeWorkspace?.name}
              </p>
            </div>
          </div>
        </div>

        {loading && !activeWorkspace ? (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : activeWorkspace ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatLayout workspaceId={activeWorkspace.id} isHubMode={true} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Không tìm thấy thông tin không gian làm việc.
          </div>
        )}
      </div>
    </>
  );
}

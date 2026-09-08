import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWorkspace } from '@/contexts/workspace-context';
import { useProject } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { projectApi } from '@/utils/api/projectApi';
import ChatLayout from '@/components/chat/ChatLayout';
import { MessageSquare } from 'lucide-react';
import { Project } from '@/types';

export default function ProjectChatPage() {
  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;
  const { currentWorkspace, getWorkspaceBySlug } = useWorkspace();
  const { currentProject } = useProject();
  const { isAuthenticated } = useAuth();

  const [project, setProject] = useState<Project | null>(currentProject || null);
  const [workspace, setWorkspace] = useState<any>(currentWorkspace || null);
  const [loading, setLoading] = useState(true);
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

    const loadData = async () => {
      if (!router.isReady || !projectSlug) return;

      try {
        setLoading(true);

        // 1. Resolve Project
        let resolvedProject: Project | null = null;
        if (currentProject && currentProject.slug === projectSlug) {
          resolvedProject = currentProject;
        } else {
          resolvedProject = await projectApi.getProjectBySlug(
            projectSlug as string,
            isAuthenticated(),
            workspaceSlug as string
          );
        }

        if (isMounted) {
          setProject(resolvedProject);
        }

        // 2. Resolve Workspace
        let resolvedWorkspace: any = null;
        if (currentWorkspace && (!workspaceSlug || currentWorkspace.slug === workspaceSlug)) {
          resolvedWorkspace = currentWorkspace;
        } else if (resolvedProject?.workspaceId) {
          resolvedWorkspace = resolvedProject.workspace || { id: resolvedProject.workspaceId };
        } else if (workspaceSlug) {
          resolvedWorkspace = await getWorkspaceBySlug(workspaceSlug as string);
        }

        if (isMounted) {
          setWorkspace(resolvedWorkspace);
        }
      } catch (error) {
        console.error('Failed to load project or workspace for chat:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, projectSlug, workspaceSlug, currentProject, currentWorkspace, isAuthenticated, getWorkspaceBySlug]);

  const activeWorkspaceId = workspace?.id || project?.workspaceId;
  const activeProjectId = project?.id;

  return (
    <>
      <Head>
        <title>
          Trò chuyện - {project ? project.name : 'Dự án'} | Taskosaur
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
                Kênh Trò Chuyện Dự Án
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Trao đổi, chia sẻ tài liệu và thảo luận tiến độ cho dự án {project?.name}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : activeWorkspaceId && activeProjectId ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatLayout
              workspaceId={activeWorkspaceId}
              projectId={activeProjectId}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Không tìm thấy thông tin dự án.
          </div>
        )}
      </div>
    </>
  );
}

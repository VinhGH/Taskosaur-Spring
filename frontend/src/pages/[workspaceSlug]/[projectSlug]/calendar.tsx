import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import TaskCalendarView from "@/components/tasks/views/TaskCalendarView";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useProjectContext } from "@/contexts/project-context";
import { useTask } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/common/PageHeader";
import ActionButton from "@/components/common/ActionButton";
import { Card, CardContent } from "@/components/ui/card";
import { HiCalendarDays } from "react-icons/hi2";
import ErrorState from "@/components/common/ErrorState";
import { useLayout } from "@/contexts/layout-context";
import NotFound from "@/pages/404";
import { useSlugRedirect, cacheSlugId } from "@/hooks/useSlugRedirect";

const LoadingSkeleton = () => (
  <div className="flex min-h-screen bg-[var(--background)]">
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-[var(--muted)] rounded w-20"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-24"></div>
          </div>

          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-[var(--muted)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
          </div>

          {/* Controls skeleton */}
          <div className="h-10 bg-[var(--muted)] rounded w-32"></div>

          {/* Calendar skeleton */}
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
            <CardContent className="p-6">
              <div className="h-96 bg-[var(--muted)] rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

function ProjectTasksCalendarPageContent() {
  const { t } = useTranslation(["calendar", "common"]);
  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;
  const { getUserAccess } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [userAccess, setUserAcess] = useState(null);

  const authContext = useAuth();
  const workspaceContext = useWorkspaceContext();
  const projectContext = useProjectContext();
  const taskContext = useTask();
  const { handleSlugNotFound } = useSlugRedirect();

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isNewTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [currentRange, setCurrentRange] = useState<{ from: Date; to: Date; dateField: string } | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Track the current route to prevent duplicate calls
  const currentRouteRef = useRef<string>("");
  const isFirstRenderRef = useRef(true);

  const findProjectBySlug = (projects: any[], slug: string) => {
    return projects.find((project) => project.slug === slug);
  };
  const organizationId =
    localStorage.getItem("currentOrganizationId") || localStorage.getItem("organizationId");
  const handleTaskCreated = async () => {
    try {
      if (projectData?.id && currentRange) {
        const response = await taskContext.getCalendarTask(organizationId || "", {
          projectId: projectData.id,
          includeSubtasks: true,
          from: currentRange.from.toISOString(),
          to: currentRange.to.toISOString(),
          dateField: currentRange.dateField,
          limit: 1000,
        });
        setProjectTasks(response?.data || []);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  };
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataLoaded(false);

      // Check authentication
      if (!authContext.isAuthenticated()) {
        router.push("/auth/login");
        return;
      }

      if (typeof workspaceSlug !== "string" || typeof projectSlug !== "string") {
        setError(t("errors.invalidSlug"));
        setLoading(false);
        return;
      }

      const workspace = await workspaceContext.getWorkspaceBySlug(workspaceSlug);
      if (!workspace) {
        setError(t("errors.workspaceNotFound"));
        setLoading(false);
        return;
      }
      setWorkspaceData(workspace);
      cacheSlugId("workspace", workspaceSlug, workspace.id);

      const projects = await projectContext.getProjectsByWorkspace(workspace.id);
      const project = findProjectBySlug(projects || [], projectSlug);

      if (!project) {
        setError(t("errors.projectNotFound"));
        setLoading(false);
        return;
      }
      setProjectData(project);
      cacheSlugId("project", projectSlug, project.id);

      setDataLoaded(true);
    } catch (err) {
      console.error("Error loading page data:", err);
      const redirected = await handleSlugNotFound(
        err,
        workspaceSlug as string,
        projectSlug as string,
        workspaceData?.id,
        projectData?.id
      );
      if (!redirected) {
        setError(err?.message ? err.message : t("errors.failedLoadData"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRangeTasks = async () => {
      if (!projectData?.id || !currentRange) return;

      setTasksLoading(true);
      try {
        const response = await taskContext.getCalendarTask(organizationId || "", {
          projectId: projectData.id,
          includeSubtasks: true,
          from: currentRange.from.toISOString(),
          to: currentRange.to.toISOString(),
          dateField: currentRange.dateField,
          limit: 1000,
        });
        setProjectTasks(response?.data || []);
      } catch (error) {
        console.error("Error fetching tasks for range:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchRangeTasks();
  }, [projectData?.id, currentRange]);

  const handleRangeChange = useCallback((range: { from: Date; to: Date; dateField: string }) => {
    setCurrentRange((prev) => {
      if (
        prev &&
        prev.from.getTime() === range.from.getTime() &&
        prev.to.getTime() === range.to.getTime() &&
        prev.dateField === range.dateField
      ) {
        return prev;
      }
      return range;
    });
  }, []);

  useEffect(() => {
    if (!projectData?.id) return;
    getUserAccess({ name: "project", id: projectData?.id })
      .then((data) => {
        setHasAccess(data?.canChange);
        setUserAcess(data);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [projectData]);

  useEffect(() => {
    if (!workspaceSlug || !projectSlug) return;

    const currentRoute = `${workspaceSlug}/${projectSlug}/tasks/calendar`;

    // Prevent duplicate calls for the same route
    if (currentRouteRef.current === currentRoute && !isFirstRenderRef.current) {
      return;
    }

    // Only reset state and fetch if this is a new route
    if (currentRouteRef.current !== currentRoute) {
      setWorkspaceData(null);
      setProjectData(null);
      setProjectTasks([]);
      setError(null);
      setDataLoaded(false);

      currentRouteRef.current = currentRoute;
      loadData();
    }

    isFirstRenderRef.current = false;
  }, [workspaceSlug, projectSlug]);

  const { setShow404, show404 } = useLayout();

  useEffect(() => {
    if (error && !show404) {
      const is404Error =
        error.toLowerCase().includes("not found") ||
        error.toLowerCase().includes("404") ||
        error.toLowerCase().includes("project not found") ||
        error.toLowerCase().includes("workspace not found") ||
        error.toLowerCase().includes("not a member of this scope") ||
        error.toLowerCase().includes("forbidden") ||
        error.toLowerCase().includes("403") ||
        error.toLowerCase().includes("unauthorized");

      if (is404Error) {
        setShow404(true);
      }
    }
  }, [error, setShow404, show404]);

  if (error) {
    const is404Error =
      error.toLowerCase().includes("not found") ||
      error.toLowerCase().includes("404") ||
      error.toLowerCase().includes("project not found") ||
      error.toLowerCase().includes("workspace not found") ||
      error.toLowerCase().includes("not a member of this scope") ||
      error.toLowerCase().includes("forbidden") ||
      error.toLowerCase().includes("403") ||
      error.toLowerCase().includes("unauthorized");

    if (is404Error) {
      return <NotFound />;
    }
    return <ErrorState error={error} onRetry={loadData} />;
  }

  if (loading || !dataLoaded) {
    return <LoadingSkeleton />;
  }

  if (!workspaceData || !projectData) {
    return <ErrorState error={t("errors.projectOrWorkspaceNotFound")} onRetry={loadData} />;
  }

  return (
    <div className="dashboard-container">
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <div className="min-h-screen">
            <div className="flex flex-col gap-4">
              <PageHeader
                title={t("title", { name: projectData?.name })}
                description={t("description", { name: projectData?.name })}
                actions={
                  userAccess?.role !== "VIEWER" && (
                    <ActionButton primary showPlusIcon onClick={() => setNewTaskModalOpen(true)}>
                      {t("createTask")}
                    </ActionButton>
                  )
                }
              />

              {/* Calendar Content */}
              <Card className="h-full border-none shadow-none p-0">
                <CardContent className="p-0">
                  {/* Calendar View */}
                  <div className="">
                    <TaskCalendarView
                      tasks={projectTasks}
                      workspaceSlug={workspaceSlug as string}
                      projectSlug={projectSlug as string}
                      onRangeChange={handleRangeChange}
                      isLoading={tasksLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setNewTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        workspaceSlug={workspaceSlug as string}
        projectSlug={projectSlug as string}
      />
    </div>
  );
}

export default function ProjectTasksCalendarPage() {
  return <ProjectTasksCalendarPageContent />;
}

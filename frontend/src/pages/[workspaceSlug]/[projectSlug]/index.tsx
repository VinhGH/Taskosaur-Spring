import { ProjectAnalytics } from "@/components/projects/ProjectAnalytics";
import { useRouter } from "next/router";
import { SEO } from "@/components/common/SEO";
import { useState, useEffect } from "react";
import { projectApi } from "@/utils/api/projectApi";
import { useAuth } from "@/contexts/auth-context";
import { Project } from "@/types";

export default function ProjectPage() {
  const router = useRouter();
  const { projectSlug, workspaceSlug } = router.query;
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectSlug) return;
      try {
        const proj = await projectApi.getProjectBySlug(
          projectSlug as string,
          isAuthenticated(),
          workspaceSlug as string
        );
        setProject(proj);
      } catch (error) {
        console.error("Failed to load project:", error);
      }
    };
    loadProject();
  }, [projectSlug, workspaceSlug, isAuthenticated]);

  const displayTitle = project?.name || "Project";

  return (
    <div className="dashboard-container">
      <SEO title={displayTitle} />
      <ProjectAnalytics projectSlug={projectSlug as string} />
    </div>
  );
}

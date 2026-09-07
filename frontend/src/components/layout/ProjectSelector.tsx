import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useProject } from "@/contexts/project-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { getCurrentProjectId, setCurrentProjectId } from "@/utils/hierarchyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Check } from "lucide-react";
import { Project } from "@/types";

interface ProjectSelectorProps {
  currentWorkspaceSlug: string | null;
  currentProjectSlug: string | null;
}

export default function ProjectSelector({
  currentWorkspaceSlug,
  currentProjectSlug,
}: ProjectSelectorProps) {
  const { t } = useTranslation("sidebar");
  const router = useRouter();
  const { getProjectsByWorkspace, projects } = useProject();
  const { getWorkspaceBySlug } = useWorkspace();

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false); // loading starts true

  /* ---------------- fetch workspace ---------------- */
  useEffect(() => {
    // Skip if no slug or if it's an unparsed route parameter (e.g., "[workspaceSlug]")
    if (!currentWorkspaceSlug || currentWorkspaceSlug.startsWith('[')) return;

    getWorkspaceBySlug(currentWorkspaceSlug)
      .then(setCurrentWorkspace)
      .catch(() => setCurrentWorkspace(null));
  }, [currentWorkspaceSlug]);

  /* ---------------- fetch projects ---------------- */
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        await getProjectsByWorkspace(currentWorkspace.id);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [currentWorkspace?.id]);

  /* ---------------- resolve current project ---------------- */
  useEffect(() => {
    if (projects.length === 0) {
      setCurrentProject(null);
      return;
    }

    // 1. Try URL slug
    let project =
      currentProjectSlug &&
      projects.find((p) => (p.slug || slugify(p.name)) === currentProjectSlug);

    // 2. Fallback to localStorage id
    if (!project) {
      const storedId = getCurrentProjectId(); // util that reads localStorage
      project = projects.find((p) => p.id === storedId);
    }
    setCurrentProject(project ?? null);
  }, [projects, currentProjectSlug]);

  /* ---------------- handlers ---------------- */
  const handleProjectSelect = (project: Project) => {
    if (!currentWorkspaceSlug) return;

    setCurrentProjectId(project.id);
    window.dispatchEvent(new CustomEvent("projectChanged"));

    router.replace(`/${currentWorkspaceSlug}/${project.slug || slugify(project.name)}`);
  };

  /* ---------------- helpers ---------------- */
  const getProjectKey = (p: Project) => p.key || p.name.slice(0, 3).toUpperCase();
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  /* ---------------- render ---------------- */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="layout-project-selector-trigger group flex items-center justify-between gap-2 px-2.5 py-1.5 w-full rounded-lg cursor-pointer border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)]/30 hover:bg-[var(--sidebar-accent)]/70 transition-all duration-200">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="layout-project-selector-icon flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-2xs"
              style={{ backgroundColor: currentProject?.color || "var(--sidebar-primary)" }}
            >
              {currentProject ? getProjectKey(currentProject) : "P"}
            </div>

            <div className="layout-project-selector-content min-w-0 flex-1">
              {isLoading ? (
                <div className="layout-project-selector-loading h-3.5 bg-[var(--sidebar-muted)]/40 rounded w-24 animate-pulse" />
              ) : (
                <div className="layout-project-selector-title text-xs font-semibold text-[var(--sidebar-foreground)] truncate">
                  {currentProject ? currentProject.name : t("selectProject")}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] border border-[var(--sidebar-border)]">
              {t("project") || "Dự án"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--sidebar-muted)] transition-transform duration-200 group-hover:text-[var(--sidebar-foreground)]" />
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="layout-project-selector-dropdown w-64 p-1.5 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-lg"
        align="start"
        sideOffset={6}
      >
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project)}
            className={`layout-project-selector-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
              currentProject?.id === project.id
                ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                : "hover:bg-[var(--accent)] text-[var(--sidebar-foreground)]"
            }`}
          >
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarFallback
                className="text-[10px] font-bold text-white rounded-md flex items-center justify-center"
                style={{ backgroundColor: project.color || "var(--primary)" }}
              >
                {getProjectKey(project)}
              </AvatarFallback>
            </Avatar>

            <div className="layout-project-selector-item-content min-w-0 flex-1">
              <div className="layout-project-selector-item-name text-xs font-medium truncate">{project.name}</div>
              {project.description && (
                <div className="layout-project-selector-item-description text-[10px] text-[var(--sidebar-muted)] truncate">
                  {project.description}
                </div>
              )}
            </div>

            {currentProject?.id === project.id && (
              <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

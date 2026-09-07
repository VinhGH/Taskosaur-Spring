import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  clearCurrentProjectId,
} from "@/utils/hierarchyContext";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
}

interface WorkspaceSelectorProps {
  currentWorkspaceSlug: string | null;
}

export default function WorkspaceSelector({ currentWorkspaceSlug }: WorkspaceSelectorProps) {
  const { t } = useTranslation("sidebar");
  const router = useRouter();

  const { getWorkspacesByOrganization, workspaces } = useWorkspace();

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  // Fetch workspaces for current organization
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        await getWorkspacesByOrganization();
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();

    const handleOrganizationChange = () => {
      setCurrentWorkspace(null);
      fetchWorkspaces();
    };

    window.addEventListener("organizationChanged", handleOrganizationChange);
    return () => {
      window.removeEventListener("organizationChanged", handleOrganizationChange);
    };
  }, []);

  // Resolve current workspace from URL slug or localStorage fallback
  useEffect(() => {
    if (workspaces.length === 0) {
      setCurrentWorkspace(null);
      return;
    }

    // 1. Try URL slug first
    let workspace = currentWorkspaceSlug && workspaces.find((w) => w.slug === currentWorkspaceSlug);

    // 2. Fallback to localStorage id
    if (!workspace) {
      const storedId = getCurrentWorkspaceId(); // util that reads localStorage
      workspace = workspaces.find((w) => w.id === storedId);
    }

    setCurrentWorkspace(workspace || null);
  }, [workspaces, currentWorkspaceSlug]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    // Store the workspace ID in localStorage for hierarchy context
    setCurrentWorkspaceId(workspace.id);
    // Clear project context since we're switching workspaces
    clearCurrentProjectId();

    // Dispatch workspace change event
    window.dispatchEvent(new CustomEvent("workspaceChanged"));

    // Navigate to the workspace homepage
    // This replaces the current route to prevent going back to old workspace contexts
    router.replace(`/${workspace.slug}`);
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "W";
  };

  // Always render the selector (show loading state instead of hiding)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="layout-workspace-selector-trigger group flex items-center justify-between gap-2 px-2.5 py-1.5 w-full rounded-lg cursor-pointer border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)]/30 hover:bg-[var(--sidebar-accent)]/70 transition-all duration-200">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="layout-workspace-selector-icon flex-shrink-0 w-7 h-7 rounded-md bg-[var(--sidebar-primary)] flex items-center justify-center text-[var(--sidebar-primary-foreground)] text-xs font-bold shadow-2xs">
              {currentWorkspace ? getInitials(currentWorkspace.name) : "W"}
            </div>

            <div className="layout-workspace-selector-content min-w-0 flex-1">
              {isLoading ? (
                <div className="layout-workspace-selector-loading h-3.5 bg-[var(--sidebar-muted)]/40 rounded w-24 animate-pulse" />
              ) : (
                <div className="layout-workspace-selector-title text-xs font-semibold text-[var(--sidebar-foreground)] truncate">
                  {currentWorkspace ? currentWorkspace.name : t("selectWorkspace")}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] border border-[var(--sidebar-border)]">
              Workspace
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--sidebar-muted)] transition-transform duration-200 group-hover:text-[var(--sidebar-foreground)]" />
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="layout-workspace-selector-dropdown w-64 p-1.5 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-lg"
        align="start"
        sideOffset={6}
      >
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace)}
            className={`layout-workspace-selector-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
              currentWorkspace?.id === workspace.id
                ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                : "hover:bg-[var(--accent)] text-[var(--sidebar-foreground)]"
            }`}
          >
            <Avatar className="h-6 w-6 rounded-md">
              <AvatarFallback className="text-[10px] font-bold text-white rounded-md bg-[var(--primary)] flex items-center justify-center">
                {getInitials(workspace.name)}
              </AvatarFallback>
            </Avatar>
            <div className="layout-workspace-selector-item-content min-w-0 flex-1">
              <div className="layout-workspace-selector-item-name text-xs font-medium truncate">{workspace.name}</div>
              {workspace.description && (
                <div className="layout-workspace-selector-item-description text-[10px] text-[var(--sidebar-muted)] truncate">
                  {workspace.description}
                </div>
              )}
            </div>
            {currentWorkspace?.id === workspace.id && (
              <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

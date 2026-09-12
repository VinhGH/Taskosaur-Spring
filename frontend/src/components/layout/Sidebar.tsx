import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getSidebarCollapsedState, toggleSidebar as toggleSidebarUtil } from "@/utils/sidebarUtils";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  ListTodo,
  Timer,
  CalendarDays,
  Users,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronDown,
  Home,
  Menu,
  Activity,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/router";
import ResizableSidebar from "./ResizableSidebar";
import WorkspaceSelector from "./WorkspaceSelector";
import ProjectSelector from "./ProjectSelector";
import WorkspaceTree from "./WorkspaceTree";
import Tooltip from "@/components/common/ToolTip";
import { useProject } from "@/contexts/project-context";
import { useWorkspace } from "@/contexts/workspace-context";

// Type definitions
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

const usePathnameParsing = (pathname: string, isMounted: boolean) => {
  return useMemo(() => {
    if (!isMounted) return { currentWorkspaceSlug: null, currentProjectSlug: null };

    const parts = pathname.split("/").filter(Boolean);

    // Check for unparsed route parameters (e.g., [workspaceSlug]) - router not ready yet
    if (parts.some(part => part.startsWith('[') && part.endsWith(']'))) {
      return { currentWorkspaceSlug: null, currentProjectSlug: null };
    }

    // Define global routes that should not be treated as workspace slugs
    const globalRoutes = [
      "dashboard",
      "workspaces",
      "projects",
      "activities",
      "settings",
      "tasks",
      "notifications",
      "admin",
    ];

    // Define workspace-level routes that should not be treated as project slugs
    const workspaceRoutes = ["projects", "members", "activities", "tasks", "analytics", "settings", "chat"];

    if (parts.length === 0 || globalRoutes.includes(parts[0])) {
      return { currentWorkspaceSlug: null, currentProjectSlug: null };
    }

    if (parts.length === 1) {
      return { currentWorkspaceSlug: parts[0], currentProjectSlug: null };
    }

    if (parts.length >= 2) {
      // If the second part is a workspace-level route, don't treat it as a project slug
      if (workspaceRoutes.includes(parts[1])) {
        return { currentWorkspaceSlug: parts[0], currentProjectSlug: null };
      }
      return { currentWorkspaceSlug: parts[0], currentProjectSlug: parts[1] };
    }

    return { currentWorkspaceSlug: null, currentProjectSlug: null };
  }, [pathname, isMounted]);
};

export default function Sidebar() {
  const { t } = useTranslation("sidebar");
  const router = useRouter();
  const pathname = router.asPath.split("?")[0];
  const { isAuthenticated, getCurrentUser } = useAuth();
  const isAuth = isAuthenticated();
  const currentUser = getCurrentUser();
  const { getProjectBySlug, currentProject } = useProject();
  const [isMounted, setIsMounted] = useState(false);
  const [miniPathName, setMiniPathName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return getSidebarCollapsedState();
    }
    return false;
  });
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const { currentWorkspaceSlug, currentProjectSlug } = usePathnameParsing(pathname, isMounted);
  const { workspaces, getWorkspaceBySlug } = useWorkspace();
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  useEffect(() => {
    if (!currentWorkspaceSlug || currentWorkspaceSlug.startsWith("[")) {
      setCurrentWorkspace(null);
      return;
    }
    const found = workspaces?.find((w) => w.slug === currentWorkspaceSlug);
    if (found) {
      setCurrentWorkspace(found);
      return;
    }
    getWorkspaceBySlug(currentWorkspaceSlug)
      .then(setCurrentWorkspace)
      .catch(() => setCurrentWorkspace(null));
  }, [currentWorkspaceSlug, workspaces, getWorkspaceBySlug]);

  useEffect(() => {
    setIsMounted(true);
    const storedState = getSidebarCollapsedState();
    if (storedState !== isSidebarCollapsed) {
      setIsSidebarCollapsed(storedState);
    }
  }, []);

  const toggleSidebar = (forceValue?: boolean) => {
    setHasUserInteracted(true);
    toggleSidebarUtil(setIsSidebarCollapsed, forceValue);
  };

  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      if (window.innerWidth < 768 && !isSidebarCollapsed && !hasUserInteracted) {
        toggleSidebarUtil(setIsSidebarCollapsed, true);
      }
    };

    window.addEventListener("resize", handleResize);

    if (!hasUserInteracted) {
      handleResize();
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarCollapsed, hasUserInteracted]);

  // Handle disabled navigation click
  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  const globalNavItems = useMemo(
    () => [
      {
        name: t("dashboard"),
        href: "/dashboard",
        icon: <LayoutDashboard size={16} strokeWidth={1.8} />,
        title: t("globalDashboard"),
        disabled: !isAuth,
      },
      {
        name: t("workspaces"),
        href: "/workspaces",
        icon: <Building2 size={16} strokeWidth={1.8} />,
        title: t("allWorkspaces"),
        disabled: !isAuth,
      },
      {
        name: t("projects"),
        href: "/projects",
        icon: <FolderKanban size={16} strokeWidth={1.8} />,
        title: t("allProjects"),
        disabled: !isAuth,
      },
      {
        name: t("tasks"),
        href: "/tasks",
        icon: <ListTodo size={16} strokeWidth={1.8} />,
        title: t("allTasks"),
        disabled: !isAuth,
      },
      {
        name: t("activities"),
        href: "/activities",
        icon: <Activity size={16} strokeWidth={1.8} />,
        title: t("allActivities"),
        disabled: !isAuth,
      },
      // Settings only shown to authenticated users
      ...(isAuth
        ? [
            {
              name: t("settings"),
              href: "/settings",
              icon: <Settings size={16} strokeWidth={1.8} />,
              title: t("allSettings"),
              disabled: false,
            },
          ]
        : []),
      // Admin panel only shown to super admins
      ...(isAuth && currentUser?.role === "SUPER_ADMIN"
        ? [
            {
              name: t("admin"),
              href: "/admin",
              icon: <ShieldCheck size={16} strokeWidth={1.8} />,
              title: t("systemAdministration"),
              disabled: false,
            },
          ]
        : []),
    ],
    [isAuth, currentUser?.role, t]
  );

  const workspaceNavItems = useMemo(
    () =>
      currentWorkspaceSlug
        ? [
            {
              name: t("workspaceOverview") || "Tổng quan Workspace",
              href: `/${currentWorkspaceSlug}`,
              icon: <LayoutDashboard size={16} strokeWidth={1.8} />,
              title: t("workspaceOverview"),
              disabled: !isAuth,
            },
            {
              name: t("projects"),
              href: `/${currentWorkspaceSlug}/projects`,
              icon: <FolderKanban size={16} strokeWidth={1.8} />,
              title: t("workspaceProjects"),
              disabled: !isAuth,
            },
            {
              name: t("members"),
              href: `/${currentWorkspaceSlug}/members`,
              icon: <Users size={16} strokeWidth={1.8} />,
              title: t("workspaceMembers"),
              disabled: !isAuth,
            },
            {
              name: t("activities"),
              href: `/${currentWorkspaceSlug}/activities`,
              icon: <Activity size={16} strokeWidth={1.8} />,
              title: t("workspaceActivity"),
              disabled: !isAuth,
            },
            {
              name: t("tasks"),
              href: `/${currentWorkspaceSlug}/tasks`,
              icon: <ListTodo size={16} strokeWidth={1.8} />,
              title: t("workspaceTasks"),
              disabled: !isAuth,
            },
            {
              name: t("chat") || "Trò chuyện",
              href: `/${currentWorkspaceSlug}/chat`,
              icon: <MessageSquare size={16} strokeWidth={1.8} />,
              title: t("workspaceChat") || "Kênh trò chuyện",
              disabled: !isAuth,
            },
            // Settings only shown to authenticated users
            ...(isAuth
              ? [
                  {
                    name: t("settings"),
                    href: `/${currentWorkspaceSlug}/settings`,
                    icon: <SlidersHorizontal size={16} strokeWidth={1.8} />,
                    title: t("workspaceSettings"),
                    disabled: false,
                  },
                ]
              : []),
          ]
        : [],
    [currentWorkspaceSlug, isAuth, t]
  );

  // Default project navigation items for unauthenticated users (all disabled)
  const defaultProjectNavItems = useMemo(
    () => [
      {
        name: t("projectOverview") || "Tổng quan dự án",
        href: currentWorkspaceSlug && currentProjectSlug ? `/${currentWorkspaceSlug}/${currentProjectSlug}` : "#",
        icon: <LayoutDashboard size={16} strokeWidth={1.8} />,
        title: t("projectOverview"),
        disabled: false, // usually for unauthenticated users
      },
      {
        name: t("tasks"),
        href: currentWorkspaceSlug && currentProjectSlug ? `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks` : "#",
        icon: <ListTodo size={16} strokeWidth={1.8} />,
        title: t("tasks"),
        disabled: false,
      },
      {
        name: t("sprints"),
        href: currentWorkspaceSlug && currentProjectSlug ? `/${currentWorkspaceSlug}/${currentProjectSlug}/sprints` : "#",
        icon: <Timer size={16} strokeWidth={1.8} />,
        title: t("sprints"),
        disabled: false,
      },
    ],
    [currentWorkspaceSlug, currentProjectSlug, t]
  );

  const projectNavItems = useMemo(() => {
    // If user is not authenticated, show default project items (disabled)
    if (!isAuth) {
      return defaultProjectNavItems;
    }

    // If user is authenticated, show actual project items
    return currentWorkspaceSlug && currentProjectSlug
      ? [
          {
            name: t("projectOverview") || "Tổng quan dự án",
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}`,
            icon: <LayoutDashboard size={16} strokeWidth={1.8} />,
            title: t("projectOverview"),
            disabled: false,
          },
          {
            name: t("tasks"),
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/tasks`,
            icon: <ListTodo size={16} strokeWidth={1.8} />,
            title: t("tasks"),
            disabled: false,
          },
          {
            name: t("sprints"),
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/sprints`,
            icon: <Timer size={16} strokeWidth={1.8} />,
            title: t("sprints"),
            disabled: false,
          },
          {
            name: t("calendar"),
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/calendar`,
            icon: <CalendarDays size={16} strokeWidth={1.8} />,
            title: t("calendar"),
            disabled: false,
          },
          {
            name: t("members"),
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/members`,
            icon: <Users size={16} strokeWidth={1.8} />,
            title: t("members"),
            disabled: false,
          },
          {
            name: t("chat") || "Trò chuyện",
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/chat`,
            icon: <MessageSquare size={16} strokeWidth={1.8} />,
            title: t("projectChat") || "Trò chuyện dự án",
            disabled: false,
          },
          {
            name: t("settings"),
            href: `/${currentWorkspaceSlug}/${currentProjectSlug}/settings`,
            icon: <SlidersHorizontal size={16} strokeWidth={1.8} />,
            title: t("settings"),
            disabled: false,
          },
        ]
      : [];
  }, [currentWorkspaceSlug, currentProjectSlug, isAuth, defaultProjectNavItems, t]);

  const navigationItems: NavItem[] = useMemo(() => {
    // For unauthenticated users, always show project navigation (disabled)
    if (!isAuth) {
      return defaultProjectNavItems;
    }

    // For authenticated users, use existing logic
    if (currentWorkspaceSlug && currentProjectSlug) return projectNavItems;
    if (currentWorkspaceSlug) return workspaceNavItems;
    return globalNavItems;
  }, [
    isAuth,
    currentWorkspaceSlug,
    currentProjectSlug,
    globalNavItems,
    workspaceNavItems,
    projectNavItems,
    defaultProjectNavItems,
  ]);

  const miniSidebarNavItems = useMemo(() => {
    // For unauthenticated users, use global nav items for mini sidebar (disabled)
    if (!isAuth) {
      setMiniPathName("/workspaces");
      return globalNavItems;
    }

    if (currentWorkspaceSlug && currentProjectSlug) {
      if (isSidebarCollapsed) {
        setMiniPathName(`/${currentWorkspaceSlug}/${currentProjectSlug}`);
        return projectNavItems;
      }
      setMiniPathName(`/${currentWorkspaceSlug}`);
      return workspaceNavItems;
    }

    if (currentWorkspaceSlug) {
      if (isSidebarCollapsed) {
        setMiniPathName(`/${currentWorkspaceSlug}`);
        return workspaceNavItems;
      }
      return globalNavItems;
    }

    if (isSidebarCollapsed) {
      setMiniPathName("/dashboard");
      return globalNavItems;
    }
    return [];
  }, [
    isAuth,
    currentWorkspaceSlug,
    currentProjectSlug,
    globalNavItems,
    workspaceNavItems,
    isSidebarCollapsed,
  ]);

  // Listen for sidebar state changes from other components
  useEffect(() => {
    const handleSidebarStateChange = (event: CustomEvent) => {
      setIsSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener("sidebarStateChange", handleSidebarStateChange as EventListener);

    return () => {
      window.removeEventListener("sidebarStateChange", handleSidebarStateChange as EventListener);
    };
  }, []);
  useEffect(() => {
    const fetchProject = async () => {
      if (!currentWorkspaceSlug || !currentProjectSlug) {
        return;
      }
      try {
        if (!isAuth) {
          const project = await getProjectBySlug(currentProjectSlug, isAuth, currentWorkspaceSlug);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    };

    fetchProject();
  }, [isAuth, currentWorkspaceSlug, currentProjectSlug, defaultProjectNavItems]);

  const normalize = (url) => url.replace(/\/$/, "");

  const isActive = (pathname, itemHref, isBase = false) => {
    const current = normalize(pathname);
    const target = normalize(itemHref);

    if (isBase) {
      return current === target;
    }

    return current === target || current.startsWith(target + "/");
  };

  const renderFullSidebar = () => (
    <div className="layout-sidebar-full">
      <div className="layout-sidebar-header">
        {/* Unauthenticated State - Show "Project" Header */}
        {!isAuth && (
          <div className="layout-sidebar-header-dashboard">
            <div className="layout-sidebar-header-dashboard-content">
              <div className="layout-sidebar-header-dashboard-icon">
                <FolderKanban size={16} />
              </div>
              <span className="layout-sidebar-header-dashboard-title">
                {currentProject ? currentProject.name : t("project")}
              </span>
            </div>
          </div>
        )}

        {/* Authenticated State */}
        {isAuth && (
          <>
            {/* Global Dashboard */}
            {!currentWorkspaceSlug &&
              globalNavItems.length > 0 &&
              (() => {
                const activeItem = globalNavItems.find(
                  (item) => pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "")
                );

                return (
                  <div className="w-full flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
                        {activeItem ? activeItem.icon : <LayoutDashboard size={16} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--sidebar-foreground)] truncate leading-tight">
                          {activeItem ? activeItem.name : "Taskosaur"}
                        </span>
                        <span className="text-[10px] text-[var(--sidebar-muted)] font-medium truncate">
                          {t("globalDashboard") || "Bảng điều khiển chung"}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] border border-[var(--sidebar-border)] flex-shrink-0">
                      Global
                    </span>
                  </div>
                );
              })()}

            {/* Workspace Level: Parent Home Link + Workspace Selector */}
            {currentWorkspaceSlug && !currentProjectSlug && (
              <div className="w-full flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="group/parent flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] transition-all duration-200"
                  title="Quay về Trang chủ (Home Dashboard)"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0 text-[var(--sidebar-muted)] group-hover/parent:text-[var(--sidebar-foreground)] transition-transform duration-200 group-hover/parent:-translate-x-0.5" />
                    <Home className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate text-[11px] font-medium tracking-tight">
                      {t("dashboard") || "Trang chủ"}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] border border-[var(--sidebar-border)] flex-shrink-0">
                    Home
                  </span>
                </Link>

                <div className="w-full">
                  <WorkspaceSelector currentWorkspaceSlug={currentWorkspaceSlug} />
                </div>
              </div>
            )}

            {/* Project Level: Parent Workspace Link + Project Selector */}
            {currentWorkspaceSlug && currentProjectSlug && (
              <div className="w-full flex flex-col gap-2">
                <Link
                  href={`/${currentWorkspaceSlug}`}
                  className="group/parent flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] transition-all duration-200"
                  title={`Quay lại Workspace ${currentWorkspace?.name || currentWorkspaceSlug}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0 text-[var(--sidebar-muted)] group-hover/parent:text-[var(--sidebar-foreground)] transition-transform duration-200 group-hover/parent:-translate-x-0.5" />
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate text-[11px] font-medium tracking-tight">
                      {currentWorkspace?.name || currentWorkspaceSlug}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] border border-[var(--sidebar-border)] flex-shrink-0">
                    Workspace
                  </span>
                </Link>

                <div className="w-full">
                  <ProjectSelector
                    currentWorkspaceSlug={currentWorkspaceSlug}
                    currentProjectSlug={currentProjectSlug}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <nav className="layout-sidebar-nav">
        {/* Section Header */}
        <div className="px-3 pb-2 pt-1 text-[10px] font-bold text-[var(--sidebar-muted)] tracking-wider uppercase flex items-center justify-between">
          <span>
            {currentWorkspaceSlug && currentProjectSlug
              ? t("projectMenu", "Menu dự án")
              : currentWorkspaceSlug
              ? t("workspaceMenu", "Menu Workspace")
              : t("generalNavigation", "Điều hướng chung")}
          </span>
        </div>

        <ul className="layout-sidebar-nav-list">
          {navigationItems.map((item) => {
            const isBase =
              item.href === `/${currentWorkspaceSlug}/${currentProjectSlug}` ||
              item.href === `/${currentWorkspaceSlug}` ||
              item.href === "/dashboard";
            const isItemActive = isActive(pathname, item.href, isBase);

            return (
              <li key={item.name} className="layout-sidebar-nav-item">
                {item.disabled ? (
                  // Disabled navigation item
                  <div
                    className={`layout-sidebar-nav-link layout-sidebar-nav-link-disabled ${
                      isItemActive
                        ? "layout-sidebar-nav-link-active"
                        : "layout-sidebar-nav-link-inactive"
                    }`}
                    onClick={handleDisabledClick}
                    style={{ cursor: "pointer", opacity: 0.6 }}
                    title={t("loginRequired")}
                  >
                    <span className="layout-sidebar-nav-link-icon">{item.icon}</span>
                    <span className="layout-sidebar-nav-link-text">{item.name}</span>
                  </div>
                ) : (
                  // Enabled navigation item
                  <Link
                    href={item.href}
                    className={`layout-sidebar-nav-link ${
                      isItemActive
                        ? "layout-sidebar-nav-link-active"
                        : "layout-sidebar-nav-link-inactive"
                    }`}
                    {...(item.name === "Settings" && {
                      "data-automation-id": item.href === "/settings"
                        ? "sidebar-org-settings"
                        : item.href.endsWith("/settings") && item.href.split("/").length === 3
                        ? "sidebar-workspace-settings"
                        : "sidebar-project-settings",
                      "aria-label": item.title || "Settings"
                    })}
                  >
                    <span className="layout-sidebar-nav-link-icon">{item.icon}</span>
                    <span className="layout-sidebar-nav-link-text">{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {isAuth && currentWorkspaceSlug && !currentProjectSlug && (
          <>
            <div className="mt-4 mb-2 mx-3 border-t border-[var(--sidebar-border)]" />
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-semibold text-[var(--sidebar-muted)] uppercase tracking-wider">
              {t("workspaces")}
              </span>
            </div>
            <WorkspaceTree currentWorkspaceSlug={currentWorkspaceSlug} />
          </>
        )}
      </nav>

      {/* Sidebar Footer with Version */}
      <div className="mt-auto pt-3 border-t border-[var(--sidebar-border)]/40 flex items-center justify-between text-[11px] text-[var(--sidebar-muted)] font-mono select-none">
        <span className="font-semibold tracking-tight text-[10px] uppercase opacity-70">Taskosaur</span>
        <span className="px-1.5 py-0.5 rounded bg-[var(--sidebar-accent)]/50 text-[10px] font-medium text-[var(--sidebar-foreground)]">
          {process.env.NEXT_PUBLIC_APP_VERSION || "v0.1.0"}
        </span>
      </div>
    </div>
  );

  const renderMiniSidebar = () => {
    if (!isMounted) {
      return (
        <div className="layout-sidebar-mini">
          <div className="mb-6 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--sidebar-muted)]">
            <Menu size={16} />
          </div>
          <div className="flex-grow flex flex-col items-center gap-4"></div>
        </div>
      );
    }
    return (
      <div className="layout-sidebar-mini">
        <Tooltip content={t("expandNavigation")} position="right">
          <button
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
            className="layout-sidebar-mini-expand-button"
          >
            <Menu size={16} />
          </button>
        </Tooltip>

        <div className="layout-sidebar-mini-nav">
          {miniSidebarNavItems.map((item) => {
            const isBase =
              item.href === `/${currentWorkspaceSlug}/${currentProjectSlug}` ||
              item.href === `/${currentWorkspaceSlug}` ||
              item.href === "/dashboard";
            const isItemActive = isActive(pathname, item.href, isBase);
            const linkProps = item.disabled
              ? {
                  onClick: handleDisabledClick,
                  style: { cursor: "pointer", opacity: 0.6 },
                }
              : {};

            return item.disabled ? (
              <Tooltip key={item.name} content={t("loginRequired")} position="right">
                <div
                  className={`layout-sidebar-mini-nav-link layout-sidebar-mini-nav-link-disabled ${
                    isItemActive
                      ? "layout-sidebar-nav-link-active"
                      : "layout-sidebar-mini-nav-link-inactive"
                  }`}
                  {...linkProps}
                >
                  {item.icon}
                </div>
              </Tooltip>
            ) : (
              <Tooltip key={item.name} content={item.title || item.name} position="right">
                <Link
                  href={item.href}
                  className={`layout-sidebar-mini-nav-link ${
                    isItemActive
                      ? "layout-sidebar-nav-link-active"
                      : "layout-sidebar-mini-nav-link-inactive"
                  }`}
                >
                  {item.icon}
                </Link>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  };

  // Hide sidebar on /organization page
  const isOrganizationPage = isMounted && pathname === "/organization";

  if (isOrganizationPage) {
    return null;
  }

  return (
    <>
      {isSidebarCollapsed && (
        <Tooltip content={t("showNavigation")} position="right">
          <button
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
            className="layout-sidebar-toggle-button"
          >
            <Menu size={16} />
          </button>
        </Tooltip>
      )}

      <div className="layout-sidebar-container">
        <div
          className={`layout-sidebar-wrapper ${
            isSidebarCollapsed
              ? "layout-sidebar-wrapper-collapsed"
              : "layout-sidebar-wrapper-expanded"
          }`}
        >
          {/* Mini sidebar content */}
          {renderMiniSidebar()}

          <div className="layout-sidebar-main">
            {isMounted ? (
              <ResizableSidebar minWidth={200} maxWidth={400} className="layout-sidebar-resizable">
                {renderFullSidebar()}
              </ResizableSidebar>
            ) : (
              <div className="layout-sidebar-resizable-fallback">{renderFullSidebar()}</div>
            )}
          </div>
        </div>
      </div>

      {!isSidebarCollapsed && (
        <div
          className="layout-sidebar-overlay"
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

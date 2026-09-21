import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  Search,
  PlusCircle,
  FolderPlus,
  Sparkles,
  Sun,
  Moon,
  Languages,
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  User,
  Shield,
  Loader2,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Tooltip from "../common/ToolTip";
import { useOrganization } from "@/contexts/organization-context";
import { useWorkspaceContext } from "@/contexts/workspace-context";
import { useChatContext } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";
import { TokenManager } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchManagerProps {
  onOpenNewTask?: () => void;
  onOpenNewProject?: () => void;
  className?: string;
}

export const SearchManager: React.FC<SearchManagerProps> = ({
  onOpenNewTask,
  onOpenNewProject,
  className,
}) => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(["common", "header"]);
  const { universalSearch } = useOrganization();
  const { currentWorkspace } = useWorkspaceContext();
  const { toggleChat } = useChatContext() || {};
  const { getCurrentUser, updateUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const currentOrganizationId = TokenManager.getCurrentOrgId();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "OWNER";
  const activeWorkspaceSlug = currentWorkspace?.slug || (router.query.workspaceSlug as string) || "";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // OS Detection for Ctrl vs ⌘
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Global Ctrl + K / Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced Universal Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = searchTerm.trim();
    if (trimmed.length < 2 || !currentOrganizationId) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await universalSearch(trimmed, currentOrganizationId, 1, 20);
        if (!controller.signal.aborted) {
          setResults(response?.results || []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, currentOrganizationId, universalSearch]);

  const openSearch = () => {
    setSearchTerm("");
    setResults([]);
    setLoading(false);
    setIsOpen(true);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setSearchTerm("");
    setResults([]);
    setLoading(false);
  };

  const getWorkspaceSlug = (workspaceName: string) => {
    return (workspaceName || "workspace").toLowerCase().replace(/\s+/g, "-");
  };

  const handleResultSelect = (result: any) => {
    closeSearch();
    let targetUrl = result.url;

    switch (result.type) {
      case "task":
        if (result.context?.workspace && result.context?.project) {
          const wsSlug = getWorkspaceSlug(result.context.workspace.name);
          const prjSlug = result.context.project.slug;
          targetUrl = `/${wsSlug}/${prjSlug}/tasks/${result.slug}`;
        } else {
          targetUrl = `/tasks/${result.slug}`;
        }
        break;
      case "project":
        if (result.context?.workspace) {
          const wsSlug = getWorkspaceSlug(result.context.workspace.name);
          const prjSlug = result.context.project.slug;
          targetUrl = `/${wsSlug}/${prjSlug}`;
        } else {
          targetUrl = `/projects`;
        }
        break;
      case "workspace":
        const wsSlug = getWorkspaceSlug(result.title);
        targetUrl = `/${wsSlug}`;
        break;
      case "sprint":
        if (result.context?.workspace && result.context?.project) {
          const wsSlug = getWorkspaceSlug(result.context.workspace.name);
          const prjSlug = result.context.project.slug;
          const sprintSlug = result.metadata?.slug || result.slug || result.id;
          targetUrl = `/${wsSlug}/${prjSlug}/sprints/${sprintSlug}`;
        }
        break;
      case "user":
        targetUrl = `/settings/profile`;
        break;
      default:
        break;
    }

    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleCreateTask = () => {
    closeSearch();
    if (onOpenNewTask) {
      onOpenNewTask();
    } else {
      window.dispatchEvent(new CustomEvent("taskosaur:open-new-task"));
    }
  };

  const handleCreateProject = () => {
    closeSearch();
    if (onOpenNewProject) {
      onOpenNewProject();
    } else {
      window.dispatchEvent(new CustomEvent("taskosaur:open-new-project"));
    }
  };

  const handleOpenAI = () => {
    closeSearch();
    if (toggleChat) {
      toggleChat();
    }
  };

  const handleToggleTheme = () => {
    closeSearch();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleToggleLanguage = async () => {
    closeSearch();
    const nextLang = i18n.language === "vi" ? "en" : "vi";
    await i18n.changeLanguage(nextLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", nextLang);
    }
    if (currentUser?.id) {
      try {
        await updateUser(currentUser.id, { language: nextLang });
      } catch {}
    }
  };

  const navigateTo = (url: string) => {
    closeSearch();
    router.push(url);
  };

  // Group search results
  const groupedResults = useMemo(() => {
    const tasks = results.filter((r) => r.type === "task");
    const projects = results.filter((r) => r.type === "project");
    const workspaces = results.filter((r) => r.type === "workspace");
    const sprints = results.filter((r) => r.type === "sprint");
    const users = results.filter((r) => r.type === "user");
    return { tasks, projects, workspaces, sprints, users };
  }, [results]);

  const hasSearchResults = results.length > 0;
  const isSearchActive = searchTerm.trim().length >= 2;

  return (
    <>
      <Tooltip
        content={isMac ? "Tìm kiếm (⌘K)" : "Tìm kiếm (Ctrl + K)"}
        position="bottom"
        color="primary"
      >
        <Button
          onClick={openSearch}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 sm:w-44 lg:w-56 sm:justify-between sm:px-2.5 rounded-lg border-border/60 bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs shadow-none transition-all",
            className
          )}
          aria-label={isMac ? "Tìm kiếm (⌘K)" : "Tìm kiếm (Ctrl + K)"}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="hidden sm:inline-block truncate font-normal">
              {t("search_placeholder", "Tìm kiếm...")}
            </span>
          </div>
          <kbd className="pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/70 bg-background/80 px-1 font-mono text-[9px] font-semibold text-muted-foreground">
            <span className="text-[10px]">{isMac ? "⌘" : "Ctrl"}</span>K
          </kbd>
        </Button>
      </Tooltip>

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t("command_palette_title", "Command Palette")}
        description={t("command_palette_desc", "Tìm kiếm và thực thi tác vụ nhanh")}
        shouldFilter={!hasSearchResults}
        className="max-w-2xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-xl"
      >
        <CommandInput
          placeholder={t("command_input_placeholder", "Nhập tên việc, dự án, hoặc gõ hành động...")}
          value={searchTerm}
          onValueChange={setSearchTerm}
        />

        <CommandList className="max-h-[380px] p-2">
          {loading && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{t("searching", "Đang tìm kiếm...")}</span>
            </div>
          )}

          {!loading && isSearchActive && results.length === 0 && (
            <CommandEmpty className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {t("no_results_found", "Không tìm thấy kết quả phù hợp")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("try_different_search", "Thử tìm kiếm với từ khóa khác hoặc sử dụng thao tác nhanh bên dưới")}
              </p>
            </CommandEmpty>
          )}

          {/* 1. KẾT QUẢ TÌM KIẾM ĐA NĂNG (UNIVERSAL SEARCH RESULTS) */}
          {hasSearchResults && (
            <>
              {groupedResults.projects.length > 0 && (
                <CommandGroup heading={t("projects", "Dự án")}>
                  {groupedResults.projects.map((proj) => (
                    <CommandItem
                      key={proj.id || proj.slug}
                      onSelect={() => handleResultSelect(proj)}
                      className="cursor-pointer py-2 px-2.5"
                    >
                      <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 shrink-0 mr-2">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate text-foreground">
                          {proj.title}
                        </div>
                        {proj.context?.workspace?.name && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {proj.context.workspace.name}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30 font-normal">
                        Project
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedResults.tasks.length > 0 && (
                <CommandGroup heading={t("tasks", "Công việc")}>
                  {groupedResults.tasks.map((task) => (
                    <CommandItem
                      key={task.id || task.slug}
                      onSelect={() => handleResultSelect(task)}
                      className="cursor-pointer py-2 px-2.5"
                    >
                      <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mr-2">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate text-foreground">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {task.context?.workspace?.name && `${task.context.workspace.name} • `}
                          {task.context?.project?.name && `${task.context.project.name}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 font-normal">
                        Task
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedResults.sprints.length > 0 && (
                <CommandGroup heading="Sprints">
                  {groupedResults.sprints.map((sprint) => (
                    <CommandItem
                      key={sprint.id || sprint.slug}
                      onSelect={() => handleResultSelect(sprint)}
                      className="cursor-pointer py-2 px-2.5"
                    >
                      <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0 mr-2">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate text-foreground">
                          {sprint.title}
                        </div>
                        {sprint.context?.project?.name && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {sprint.context.project.name}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 font-normal">
                        Sprint
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedResults.workspaces.length > 0 && (
                <CommandGroup heading={t("workspaces", "Không gian làm việc")}>
                  {groupedResults.workspaces.map((ws) => (
                    <CommandItem
                      key={ws.id || ws.slug}
                      onSelect={() => handleResultSelect(ws)}
                      className="cursor-pointer py-2 px-2.5"
                    >
                      <div className="p-1 rounded-md bg-purple-500/10 text-purple-500 shrink-0 mr-2">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate text-foreground">
                          {ws.title}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-500/30 font-normal">
                        Workspace
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedResults.users.length > 0 && (
                <CommandGroup heading={t("members", "Thành viên")}>
                  {groupedResults.users.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleResultSelect(user)}
                      className="cursor-pointer py-2 px-2.5"
                    >
                      <div className="p-1 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mr-2">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate text-foreground">
                          {user.title}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-sky-500 border-sky-500/30 font-normal">
                        User
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator className="my-2" />
            </>
          )}

          {/* 2. THAO TÁC NHANH (QUICK ACTIONS) */}
          <CommandGroup heading={t("quick_actions", "Thao tác nhanh")}>
            <CommandItem
              onSelect={handleCreateTask}
              value="tạo công việc mới new task create task add task"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 mr-2">
                <PlusCircle className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground font-medium">
                {t("new_task", "Tạo công việc mới")}
              </span>
              <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                C
              </CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={handleCreateProject}
              value="tạo dự án mới new project create project"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 shrink-0 mr-2">
                <FolderPlus className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground font-medium">
                {t("new_project", "Tạo dự án mới")}
              </span>
              <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                P
              </CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={handleOpenAI}
              value="mở trợ lý ai chat taskosaur ai assistant"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-violet-500/10 text-violet-500 shrink-0 mr-2">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground font-medium">
                {t("open_ai_assistant", "Mở Trợ lý AI Taskosaur")}
              </span>
              <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                A
              </CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={handleToggleTheme}
              value="đổi giao diện theme dark light tối sáng"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0 mr-2">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </div>
              <span className="flex-1 text-xs text-foreground font-medium">
                {resolvedTheme === "dark"
                  ? t("switch_to_light", "Chuyển sang giao diện Sáng")
                  : t("switch_to_dark", "Chuyển sang giao diện Tối")}
              </span>
              <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                T
              </CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={handleToggleLanguage}
              value="đổi ngôn ngữ language tiếng việt english tieng viet"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mr-2">
                <Languages className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground font-medium">
                {i18n.language === "vi"
                  ? "Chuyển ngôn ngữ sang English"
                  : "Chuyển ngôn ngữ sang Tiếng Việt"}
              </span>
              <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                L
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-2" />

          {/* 3. ĐIỀU HƯỚNG NHANH (NAVIGATION) */}
          <CommandGroup heading={t("navigation", "Điều hướng nhanh")}>
            <CommandItem
              onSelect={() => navigateTo("/dashboard")}
              value="bảng điều khiển dashboard tổng quan"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("dashboard", "Bảng điều khiển")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() => navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}` : "/workspaces")}
              value="không gian làm việc workspace tong quan"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("workspace_overview", "Tổng quan Không gian làm việc")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() =>
                navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/projects` : "/projects")
              }
              value="danh sách dự án projects"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <FolderKanban className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("projects", "Dự án")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() =>
                navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/tasks` : "/tasks")
              }
              value="danh sách công việc tasks viec can lam"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <CheckSquare className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("tasks", "Công việc")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() =>
                navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/activities` : "/activities")
              }
              value="nhật ký hoạt động activities lịch sử"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <Activity className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("activities", "Nhật ký hoạt động")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() => navigateTo("/settings/profile")}
              value="hồ sơ cá nhân profile user account"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <User className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("profile", "Hồ sơ cá nhân")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            <CommandItem
              onSelect={() => navigateTo("/settings")}
              value="cài đặt tổ chức organization settings"
              className="cursor-pointer py-2 px-2.5"
            >
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                <Settings className="h-4 w-4" />
              </div>
              <span className="flex-1 text-xs text-foreground">
                {t("settings", "Cài đặt tổ chức")}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
            </CommandItem>

            {isAdmin && (
              <CommandItem
                onSelect={() => navigateTo("/admin")}
                value="quản trị hệ thống admin panel"
                className="cursor-pointer py-2 px-2.5"
              >
                <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="flex-1 text-xs text-foreground">
                  {t("admin_panel", "Quản trị hệ thống")}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>

        {/* FOOTER STATUS BAR WITH KEYBOARD SHORTCUTS */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[9px]">↑</kbd>
              <kbd className="rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[9px]">↓</kbd>
              <span className="ml-0.5">{t("navigate", "Di chuyển")}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
              <span className="ml-0.5">{t("select", "Chọn")}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[9px]">ESC</kbd>
            <span className="ml-0.5">{t("close", "Đóng")}</span>
          </span>
        </div>
      </CommandDialog>
    </>
  );
};

export default SearchManager;

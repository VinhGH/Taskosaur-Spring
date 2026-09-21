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
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Check,
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

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
];

export function removeDiacritics(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"))
    .toLowerCase()
    .trim();
}

export const SearchManager: React.FC<SearchManagerProps> = ({
  onOpenNewTask,
  onOpenNewProject,
  className,
}) => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(["header", "common"]);
  const { universalSearch } = useOrganization();
  const { currentWorkspace } = useWorkspaceContext();
  const { toggleChat } = useChatContext() || {};
  const { getCurrentUser, updateUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageView, setShowLanguageView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const currentOrganizationId = TokenManager.getCurrentOrgId();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "OWNER";
  const activeWorkspaceSlug = currentWorkspace?.slug || (router.query.workspaceSlug as string) || "";
  const currentLangCode = (i18n.language || "en").split("-")[0];
  const currentLanguageObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

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

  // Debounced Universal Search with Accent & Diacritic Tolerance
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
          let list: any[] = [];
          if (Array.isArray(response?.results)) {
            list = response.results;
          } else if (response) {
            const prjs = (response.projects || []).map((p: any) => ({
              id: p.id,
              slug: p.slug,
              title: p.name || p.title,
              type: "project",
              url: `/${p.slug || p.id}`,
              context: { workspace: { name: p.workspaceName || "" } },
            }));
            const tsks = (response.tasks || []).map((t: any) => ({
              id: t.id,
              slug: t.slug || t.id,
              title: t.title,
              type: "task",
              url: `/tasks/${t.slug || t.id}`,
              context: {
                workspace: { name: t.workspaceName || "" },
                project: { name: t.projectName || "", slug: t.projectSlug || "" },
              },
            }));
            const ws = (response.workspaces || []).map((w: any) => ({
              id: w.id,
              slug: w.slug,
              title: w.name || w.title,
              type: "workspace",
              url: `/${w.slug || w.id}`,
            }));
            list = [...prjs, ...tsks, ...ws];
          }
          setResults(list);
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
    setShowLanguageView(false);
    setLoading(false);
    setIsOpen(true);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setShowLanguageView(false);
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

  const handleSelectLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", langCode);
    }
    if (currentUser?.id) {
      try {
        await updateUser(currentUser.id, { language: langCode });
      } catch {}
    }
    setShowLanguageView(false);
    closeSearch();
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
  const searchBtnLabel = `${t("search", "Search")} (${isMac ? "⌘K" : "Ctrl + K"})`;

  return (
    <>
      <Tooltip
        content={searchBtnLabel}
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
          aria-label={searchBtnLabel}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="hidden sm:inline-block truncate font-normal">
              {t("search_placeholder", "Search anything or jump to...")}
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
        description={t("command_palette_desc", "Fast search and quick actions")}
        shouldFilter={!hasSearchResults && !showLanguageView}
        className="max-w-2xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-xl"
      >
        <div className="relative">
          <CommandInput
            placeholder={
              showLanguageView
                ? t("switch_language", "Change Language") + "..."
                : t("command_input_placeholder", "Type a command, search projects, tasks, or actions...")
            }
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {showLanguageView && (
            <button
              onClick={() => setShowLanguageView(false)}
              className="absolute right-3 top-3.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-md transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t("back", "Back")}</span>
            </button>
          )}
        </div>

        <CommandList className="max-h-[380px] p-2">
          {loading && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{t("searching", "Searching...")}</span>
            </div>
          )}

          {!loading && isSearchActive && !showLanguageView && results.length === 0 && (
            <CommandEmpty className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {t("no_results_found", "No matching results found")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("try_different_search", "Try searching with a different keyword or use the quick actions below")}
              </p>
            </CommandEmpty>
          )}

          {/* VIEW: SELECT FROM ALL 7 SUPPORTED LANGUAGES */}
          {showLanguageView ? (
            <CommandGroup heading={t("languages", "Languages")}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isCurrent = lang.code === currentLangCode;
                return (
                  <CommandItem
                    key={lang.code}
                    onSelect={() => handleSelectLanguage(lang.code)}
                    value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                    className="cursor-pointer py-2.5 px-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">
                          {lang.nativeName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {lang.name}
                        </span>
                      </div>
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-[11px] font-normal text-primary">
                        <Check className="h-3 w-3" />
                        <span>Active</span>
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            <>
              {/* 1. UNIVERSAL SEARCH RESULTS */}
              {hasSearchResults && (
                <>
                  {groupedResults.projects.length > 0 && (
                    <CommandGroup heading={t("projects", "Projects")}>
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
                    <CommandGroup heading={t("tasks", "Tasks")}>
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
                    <CommandGroup heading={t("sprints", "Sprints")}>
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
                    <CommandGroup heading={t("workspaces", "Workspaces")}>
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
                    <CommandGroup heading={t("members", "Members")}>
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

              {/* 2. MULTILINGUAL QUICK ACTIONS */}
              <CommandGroup heading={t("quick_actions", "Quick Actions")}>
                <CommandItem
                  onSelect={handleCreateTask}
                  value="new task create task add task tạo công việc mới tao cong viec moi nueva tarea nouvelle tâche neue aufgabe 新規タスク nova tarefa"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 mr-2">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground font-medium">
                    {t("new_task_action", "Create new task")}
                  </span>
                  <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                    C
                  </CommandShortcut>
                </CommandItem>

                <CommandItem
                  onSelect={handleCreateProject}
                  value="new project create project tạo dự án mới tao du an moi nuevo proyecto nouveau projet neues projekt 新規プロジェクト novo projeto"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 shrink-0 mr-2">
                    <FolderPlus className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground font-medium">
                    {t("new_project_action", "Create new project")}
                  </span>
                  <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                    P
                  </CommandShortcut>
                </CommandItem>

                <CommandItem
                  onSelect={handleOpenAI}
                  value="open ai assistant taskosaur chat mở trợ lý ai mo tro ly ai asistente ia assistant ia ki-assistent aiアシスタント assistente ia"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-violet-500/10 text-violet-500 shrink-0 mr-2">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground font-medium">
                    {t("open_ai_assistant", "Open Taskosaur AI Assistant")}
                  </span>
                  <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                    A
                  </CommandShortcut>
                </CommandItem>

                <CommandItem
                  onSelect={handleToggleTheme}
                  value="theme dark light switch theme đổi giao diện doi giao dien sáng tối claro oscuro clair sombre hell dunkel ライト ダーク claro escuro"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0 mr-2">
                    {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </div>
                  <span className="flex-1 text-xs text-foreground font-medium">
                    {resolvedTheme === "dark"
                      ? t("switch_to_light", "Switch to Light theme")
                      : t("switch_to_dark", "Switch to Dark theme")}
                  </span>
                  <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                    T
                  </CommandShortcut>
                </CommandItem>

                <CommandItem
                  onSelect={() => setShowLanguageView(true)}
                  value="change language switch language đổi ngôn ngữ doi ngon ngu tiếng việt english idioma langue sprache 言語 idioma"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mr-2">
                    <Languages className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground font-medium">
                    {t("switch_language", "Change Language")} ({currentLanguageObj.flag} {currentLanguageObj.nativeName})
                  </span>
                  <CommandShortcut className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                    L
                  </CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator className="my-2" />

              {/* 3. MULTILINGUAL FAST NAVIGATION */}
              <CommandGroup heading={t("navigation", "Navigation")}>
                <CommandItem
                  onSelect={() => navigateTo("/dashboard")}
                  value="dashboard bảng điều khiển bang dieu khien tổng quan panel de control tableau de bord ダッシュボード painel de controle"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("dashboard", "Dashboard")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() => navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}` : "/workspaces")}
                  value="workspace không gian làm việc khong gian lam viec tổng quan espacio de trabajo espace de travail arbeitsbereich ワークスペース espaço de trabalho"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("workspace_overview", "Workspace Overview")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() =>
                    navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/projects` : "/projects")
                  }
                  value="projects danh sách dự án danh sach du an proyectos projets projekte プロジェクト projetos"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("projects", "Projects")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() =>
                    navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/tasks` : "/tasks")
                  }
                  value="tasks danh sách công việc danh sach cong viec việc cần làm viec can lam tareas tâches aufgaben タスク tarefas"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("tasks", "Tasks")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() =>
                    navigateTo(activeWorkspaceSlug ? `/${activeWorkspaceSlug}/activities` : "/activities")
                  }
                  value="activities nhật ký hoạt động nhat ky hoat dong lịch sử lich su registro de actividad journal d'activité aktivitätsprotokoll アクティビティ履歴 registro de atividades"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("activities", "Activities Log")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() => navigateTo("/settings/profile")}
                  value="profile hồ sơ cá nhân ho so ca nhan tài khoản tai khoan perfil profil benutzerprofil プロフィール perfil"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("profile", "User Profile")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                <CommandItem
                  onSelect={() => navigateTo("/settings")}
                  value="settings cài đặt tổ chức cai dat to chuc cấu hình cau hinh organización paramètres einstellungen 組織設定 configurações"
                  className="cursor-pointer py-2 px-2.5"
                >
                  <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs text-foreground">
                    {t("settings", "Organization Settings")}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                </CommandItem>

                {isAdmin && (
                  <CommandItem
                    onSelect={() => navigateTo("/admin")}
                    value="admin panel quản trị hệ thống quan tri he thong administración panneau d'administration admin-bereich 管理者パネル administração"
                    className="cursor-pointer py-2 px-2.5"
                  >
                    <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mr-2">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-xs text-foreground">
                      {t("admin_panel", "Admin Panel")}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-50" />
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* FOOTER STATUS BAR WITH LOCALIZED KEYBOARD SHORTCUTS */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[9px]">↑</kbd>
              <kbd className="rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[9px]">↓</kbd>
              <span className="ml-0.5">{t("navigate", "Navigate")}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
              <span className="ml-0.5">{t("select", "Select")}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[9px]">ESC</kbd>
            <span className="ml-0.5">{t("close", "Close")}</span>
          </span>
        </div>
      </CommandDialog>
    </>
  );
};

export default SearchManager;

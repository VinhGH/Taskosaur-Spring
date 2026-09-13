import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import TaskDetailClient from "./TaskDetailClient";
import { useTask } from "../../contexts/task-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/common/ActionButton";
import { DynamicBadge } from "@/components/common/DynamicBadge";
import {
  HiPencilSquare,
  HiXMark,
  HiListBullet,
  HiCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiSparkles,
  HiCheck,
  HiArrowPath,
  HiCog6Tooth,
  HiKey,
} from "react-icons/hi2";
import Tooltip from "../common/ToolTip";
import { useAuth } from "@/contexts/auth-context";
import { Task } from "@/types";
import { formatDateForDisplay } from "@/utils/date";
import { Label, Select } from "../ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from "@/utils/data/taskData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AISettingsModal from "../settings/AISettings";
import api from "@/lib/api";
import { toast } from "sonner";
import validator from "validator";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

export interface GeneratedSubtask {
  title: string;
  description: string;
  priority: "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";
  estimatedPoints?: number;
  selected?: boolean;
}

interface SubtasksProps {
  taskId: string;
  projectId: string;
  parentTitle?: string;
  parentDescription?: string;
  onSubtaskAdded?: (subtask: Task) => void;
  onSubtaskUpdated?: (subtaskId: string, updates: any) => void;
  onSubtaskDeleted?: (subtaskId: string) => void;
  showConfirmModal?: (
    title: string,
    message: string,
    onConfirm: () => void,
    type?: "danger" | "warning" | "info"
  ) => void;
  isAssignOrRepoter: boolean;
  setLoading?: (loading: boolean) => void;
  parentSprintId?: string | null;
  parentStatusId?: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={20} className="text-[var(--primary)]" />
    <h2 className="text-md font-semibold text-[var(--foreground)]">{title}</h2>
  </div>
);

const Pagination = ({
  pagination,
  onPageChange,
  isLoading,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) => {
  if (pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t border-[var(--border)] mt-4">
      <div className="text-sm text-[var(--muted-foreground)]">
        Showing {startItem} to {endItem} of {total} subtasks
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="h-8 px-3"
        >
          <HiChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="h-8 px-3"
        >
          Next
          <HiChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function Subtasks({
  taskId,
  projectId,
  parentTitle,
  parentDescription,
  onSubtaskUpdated,
  onSubtaskDeleted,
  showConfirmModal,
  isAssignOrRepoter,
  setLoading,
  parentSprintId,
  parentStatusId,
}: SubtasksProps) {
  const { t } = useTranslation(["tasks", "common"]);
  const {
    getSubtasksByParent,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    getAllTaskStatuses,
    isLoading,
    subtTask,
    subtaskPagination,
  } = useTask();

  const { getUserAccess, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [subtaskPriority, setSubtaskPriority] = useState("MEDIUM");
  const [subtaskType, setSubtaskType] = useState("SUBTASK");

  // AI Breakdown state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiCreating, setIsAiCreating] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState("");
  const [aiSubtaskCount, setAiSubtaskCount] = useState<number>(4);
  const [generatedSubtasks, setGeneratedSubtasks] = useState<GeneratedSubtask[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectSlug } = router.query;
  const isAuth = isAuthenticated();

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true);
    setAiError(null);
  };

  const handleGenerateAiSubtasks = async () => {
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const response = await api.post("/ai-chat/breakdown-task", {
        taskId,
        projectId,
        title: parentTitle,
        description: parentDescription,
        userPrompt: aiUserPrompt.trim() || undefined,
        count: aiSubtaskCount,
      });

      if (response.data.success && Array.isArray(response.data.subtasks)) {
        setGeneratedSubtasks(
          response.data.subtasks.map((st: any) => ({
            title: st.title || "",
            description: st.description || "",
            priority: st.priority || "MEDIUM",
            estimatedPoints: st.estimatedPoints,
            selected: true,
          }))
        );
      } else {
        const err = response.data.error || "Failed to generate subtasks";
        setAiError(err);
      }
    } catch (err: any) {
      console.error("AI breakdown error:", err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to connect to AI service";
      setAiError(errMsg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleToggleSelectSubtask = (index: number) => {
    setGeneratedSubtasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSubtaskTitleChange = (index: number, newTitle: string) => {
    setGeneratedSubtasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, title: newTitle } : item))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = generatedSubtasks.length > 0 && generatedSubtasks.every((s) => s.selected);
    setGeneratedSubtasks((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const handleAcceptAndCreateSubtasks = async () => {
    const selectedItems = generatedSubtasks.filter((s) => s.selected && s.title.trim());
    if (selectedItems.length === 0) return;

    setIsAiCreating(true);
    let createdCount = 0;

    try {
      const defaultStatus =
        (parentStatusId
          ? taskStatuses.find((s) => s.id === parentStatusId)
          : null) ||
        taskStatuses.find((s) => s.category === "TODO") ||
        taskStatuses[0];

      if (!defaultStatus) {
        toast.error("No task status found");
        return;
      }

      for (const item of selectedItems) {
        const subtaskData: any = {
          title: item.title.trim(),
          description: item.description || `Subtask for parent task`,
          priority: item.priority || "MEDIUM",
          type: "SUBTASK" as const,
          startDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          projectId,
          assigneeIds: currentUser ? [currentUser.id] : [],
          statusId: defaultStatus.id,
          parentTaskId: taskId,
        };

        if (item.estimatedPoints) {
          subtaskData.storyPoints = item.estimatedPoints;
        }

        if (parentSprintId) {
          subtaskData.sprintId = parentSprintId;
        }

        await createSubtask(subtaskData);
        createdCount++;
      }

      toast.success(t("subtasks.aiBreakdown.createSuccess", { count: createdCount }));
      setIsAiModalOpen(false);
      setGeneratedSubtasks([]);
      setAiUserPrompt("");

      // Refresh subtasks list
      await getSubtasksByParent(taskId, isAuth, workspaceSlug as string, projectSlug as string, {
        page: 1,
        limit: pageSize,
      });
      setCurrentPage(1);
    } catch (error) {
      console.error("Error creating AI subtasks:", error);
      toast.error(t("subtasks.aiBreakdown.createError"));
    } finally {
      setIsAiCreating(false);
    }
  };

  // Get current user from localStorage
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          const user: User = JSON.parse(userString);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    };

    getUserFromStorage();
  }, []);

  // Check user access
  useEffect(() => {
    if (!projectId || !isAuth) return;

    getUserAccess({ name: "project", id: projectId })
      .then((data) => {
        setHasAccess(data?.canChange || isAssignOrRepoter);
      })
      .catch((error) => {
        console.error("Error fetching user access:", error);
      });
  }, [projectId, isAssignOrRepoter]);

  // Fetch task statuses
  useEffect(() => {
    if (!isAuth) return;
    const fetchStatuses = async () => {
      try {
        const statuses = await getAllTaskStatuses();
        setTaskStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch task statuses:", error);
      }
    };

    fetchStatuses();
  }, []);

  // Effect to set loading state
  useEffect(() => {
    if (setLoading) {
      setLoading(isLoading);
    }
  }, [isLoading]);

  // Fetch subtasks when component mounts, taskId changes, or page changes
  useEffect(() => {
    if (!taskId) return;

    const fetchSubtasks = async () => {
      try {
        await getSubtasksByParent(taskId, isAuth, workspaceSlug as string, projectSlug as string, {
          page: currentPage,
          limit: pageSize,
        });
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
      } finally {
        if (setLoading) setLoading(false);
      }
    };

    fetchSubtasks();
  }, [taskId, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newSubtaskTitle.trim() || !currentUser) return;

    try {
      const defaultStatus = (parentStatusId
        ? taskStatuses.find((s) => s.id === parentStatusId)
        : null) || taskStatuses.find((s) => s.category === "TODO") || taskStatuses[0];

      if (!defaultStatus) {
        console.error("No task statuses available");
        return;
      }

      const subtaskData: any = {
        title: newSubtaskTitle.trim(),
        description: `Subtask for parent task`,
        priority: subtaskPriority as "LOW" | "MEDIUM" | "HIGH" | "HIGHEST",
        type: "SUBTASK" as const,
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        projectId,
        assigneeIds: [currentUser.id],
        statusId: defaultStatus.id,
        parentTaskId: taskId,
      };

      if (parentSprintId) {
        subtaskData.sprintId = parentSprintId;
      }

      await createSubtask(subtaskData);

      setNewSubtaskTitle("");
      setSubtaskPriority("MEDIUM");
      setSubtaskType("SUBTASK");
      setIsAddingSubtask(false);

      if (currentPage > 1 && subtTask.length >= pageSize) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtaskStatus = async (subtaskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const subtask = subtTask.find((s) => s.id === subtaskId || s.slug === subtaskId);
      if (!subtask) return;

      const completedStatus = taskStatuses.find((s) => s.category === "DONE");
      const todoStatus = taskStatuses.find((s) => s.category === "TODO");

      if (!completedStatus || !todoStatus) {
        console.error("Required statuses not found (DONE or TODO categories)");
        return;
      }

      const currentStatus = taskStatuses.find((s) => s.id === subtask.statusId);
      const isCurrentlyCompleted = currentStatus?.category === "DONE";
      const newStatusId = isCurrentlyCompleted ? todoStatus.id : completedStatus.id;

      await updateSubtask(subtaskId, { statusId: newStatusId });
      onSubtaskUpdated?.(subtaskId, { statusId: newStatusId });
    } catch (error) {
      console.error("Failed to toggle subtask status:", error);
    }
  };

  const handleEditSubtask = (
    subtaskId: string,
    currentTitle: string,
    currentPriority: string,
    currentType: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    setEditingSubtaskId(subtaskId);
    setEditingTitle(currentTitle);
    setSubtaskPriority(currentPriority);
    setSubtaskType(currentType);
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editingTitle.trim()) return;

    try {
      const updateData = {
        title: editingTitle.trim(),
        priority: subtaskPriority as "LOW" | "MEDIUM" | "HIGH" | "HIGHEST",
        type: "SUBTASK" as const,
      };

      await updateSubtask(subtaskId, updateData);

      setEditingSubtaskId(null);
      setEditingTitle("");
      setSubtaskPriority("MEDIUM");
      setSubtaskType("SUBTASK");

      onSubtaskUpdated?.(subtaskId, updateData);
    } catch (error) {
      console.error("Failed to update subtask:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditingTitle("");
    setSubtaskPriority("MEDIUM");
    setSubtaskType("SUBTASK");
  };

  const handleDeleteSubtask = async (subtaskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmDelete = async () => {
      try {
        await deleteSubtask(subtaskId);

        // If we're on a page > 1 and this was the last item on the page, go back one page
        if (currentPage > 1 && subtTask.length === 1) {
          setCurrentPage(currentPage - 1);
        }

        onSubtaskDeleted?.(subtaskId);
      } catch (error) {
        console.error("Failed to delete subtask:", error);
      }
    };

    if (showConfirmModal) {
      showConfirmModal(
        t("subtasks.deleteTitle"),
        t("subtasks.deleteConfirmation"),
        confirmDelete,
        "danger"
      );
    } else {
      await confirmDelete();
    }
  };

  const handleCancelAddSubtask = () => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
    setSubtaskPriority("MEDIUM");
    setSubtaskType("SUBTASK");
  };

  // Helper function to check if subtask is completed
  const isSubtaskCompleted = (subtask: Task) => {
    const currentStatus = taskStatuses.find((s) => s.id === subtask.statusId);
    return currentStatus?.category === "DONE";
  };

  // Helper function to get priority colors
  const getPriorityColor = (priority: string) => {
    const priorityColors = {
      highest: "#EF4444",
      high: "#F97316",
      medium: "#F59E0B",
      low: "#10B981",
    };
    return priorityColors[priority?.toLowerCase() as keyof typeof priorityColors] || "#6B7280";
  };

  const getTypeColor = (type: string) => {
    const typeColors = {
      task: "#3B82F6",
      bug: "#EF4444",
      epic: "#8B5CF6",
      story: "#10B981",
    };
    return typeColors[type?.toLowerCase() as keyof typeof typeColors] || "#6B7280";
  };

  const getStatusColor = (statusId: string) => {
    const status = taskStatuses.find((s) => s.id === statusId);
    if (!status) return "#6B7280";

    const statusColors = {
      done: "#10B981",
      completed: "#10B981",
      "in progress": "#3B82F6",
      in_progress: "#3B82F6",
      review: "#8B5CF6",
      todo: "#6B7280",
      "to do": "#6B7280",
    };
    return statusColors[status.name?.toLowerCase() as keyof typeof statusColors] || "#6B7280";
  };

  const completedCount = Array.isArray(subtTask)
    ? subtTask.filter((s) => isSubtaskCompleted(s)).length
    : 0;

  return (
    <>
      {selectedSubtask && router.query.taskId === selectedSubtask.slug && (
        <div className="">
          <TaskDetailClient
            task={selectedSubtask}
            taskId={selectedSubtask.slug}
            workspaceSlug={workspaceSlug as string | undefined}
            projectSlug={projectSlug as string | undefined}
            open="modal"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader
            icon={HiListBullet}
            title={`${t("subtasks.title")} (${completedCount}/${
              subtaskPagination?.total || (Array.isArray(subtTask) ? subtTask.length : 0)
            })`}
          />
          {hasAccess && isAuth && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAiModal}
              className="flex items-center gap-1.5 text-xs font-medium border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 mb-4 transition-all shadow-sm"
            >
              <HiSparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>{t("subtasks.aiBreakdown.button")}</span>
            </Button>
          )}
        </div>

        {/* Subtasks List */}
        {Array.isArray(subtTask) && subtTask.length > 0 && (
          <div className="space-y-2">
            {subtTask.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start gap-3 group p-3 rounded-lg bg-[var(--card)] hover:bg-[var(--accent)] border-none transition-colors shadow-sm hover:shadow-md cursor-pointer"
                onClick={(e) => {
                  if (!isAuth) return;
                  if (
                    (e.target as HTMLElement).closest("button") ||
                    (e.target as HTMLElement).closest(".action-button") ||
                    (e.target as HTMLElement).closest("svg") ||
                    (e.target as HTMLElement).closest('input[type="checkbox"]')
                  ) {
                    return;
                  }
                  setSelectedSubtask(subtask);

                  // Sanitize slugs before URL construction
                  const sanitizeSlug = (slug: string | string[] | undefined): string => {
                    if (!slug || typeof slug !== 'string') return '';
                    if (!/^[a-zA-Z0-9._-]+$/.test(slug)) return '';
                    return slug;
                  };

                  const safeWorkspaceSlug = sanitizeSlug(workspaceSlug);
                  const safeProjectSlug = sanitizeSlug(projectSlug);

                  const subtaskUrl =
                    safeWorkspaceSlug && safeProjectSlug
                      ? `/${safeWorkspaceSlug}/${safeProjectSlug}/tasks/${subtask.slug}`
                      : `/tasks/${subtask.slug}`;

                  if (editingSubtaskId !== subtask.id && editingSubtaskId !== subtask.slug) {
                    router.push(subtaskUrl);
                  }
                }}
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  {editingSubtaskId === subtask.id || editingSubtaskId === subtask.slug ? (
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={editingTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingTitle(e.target.value)
                        }
                        placeholder={t("subtasks.enterTitle")}
                        className="h-9 border-input bg-background text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                             handleSaveEdit(subtask.slug);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-priority" className="text-xs font-medium">
                            {t("subtasks.priority")}
                          </Label>
                          <Select
                            value={subtaskPriority}
                            onValueChange={setSubtaskPriority}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full h-8 text-xs  border-[var(--border)] bg-[var(--background)]">
                              <SelectValue placeholder={t("subtasks.selectPriority")} />
                            </SelectTrigger>
                            <SelectContent className="border-none bg-[var(--card)]">
                              {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="hover:bg-[var(--hover-bg)] text-xs"
                                >
                                  <div className="flex items-center gap-2">{option.label}</div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <ActionButton
                          onClick={() => handleSaveEdit(subtask.slug)}
                          disabled={isLoading || !editingTitle.trim()}
                          primary
                          className="h-8 px-3 cursor-pointer"
                        >
                          {t("common:save")}
                        </ActionButton>
                        <ActionButton
                          onClick={handleCancelEdit}
                          variant="outline"
                          secondary
                          className="h-8 px-3 cursor-pointer"
                        >
                          {t("subtasks.cancel")}
                        </ActionButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => handleToggleSubtaskStatus(subtask.slug, e)}
                            className="cursor-pointer"
                          >
                            {isSubtaskCompleted(subtask) ? (
                              <div className="w-4 h-4 flex items-center justify-center text-green-500">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-[var(--border)] rounded" />
                            )}
                          </div>
                          <div
                            onClick={(e) => handleToggleSubtaskStatus(subtask.slug, e)}
                            className={`text-sm font-medium cursor-pointer line-clamp-2 ${isSubtaskCompleted(subtask)
                              ? "text-[var(--muted-foreground)] line-through"
                              : "text-[var(--foreground)]"
                              }`}
                          >
                            {subtask.title}
                          </div>
                        </div>

                        {isAuth && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                            <Tooltip content={t("subtasks.edit")} position="top" color="primary">
                              <ActionButton
                                onClick={(e) =>
                                  handleEditSubtask(
                                    subtask.slug,
                                    subtask.title,
                                    subtask.priority,
                                    subtask.type,
                                    e
                                  )
                                }
                                variant="ghost"
                                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] cursor-pointer p-1"
                                disabled={isLoading}
                              >
                                <HiPencilSquare className="w-4 h-4" />
                              </ActionButton>
                            </Tooltip>
                            <Tooltip content={t("subtasks.delete")} position="top" color="primary">
                              <ActionButton
                                onClick={(e) => handleDeleteSubtask(subtask.slug, e)}
                                variant="ghost"
                                className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] cursor-pointer p-1"
                                disabled={isLoading}
                              >
                                <HiXMark className="w-4 h-4" />
                              </ActionButton>
                            </Tooltip>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-6">
                        <DynamicBadge
                          label={
                            subtask.priority.charAt(0) + subtask.priority.slice(1).toLowerCase()
                          }
                          bgColor={getPriorityColor(subtask.priority)}
                          size="sm"
                          className="px-1.5 py-0.5 text-[10px] h-5 min-h-0"
                        />
                        <DynamicBadge
                          label={subtask.type.charAt(0) + subtask.type.slice(1).toLowerCase()}
                          bgColor={getTypeColor(subtask.type)}
                          size="sm"
                          className="px-1.5 py-0.5 text-[10px] h-5 min-h-0"
                        />
                        <DynamicBadge
                          label={
                            taskStatuses.find((s) => s.id === subtask.statusId)?.name || "Unknown"
                          }
                          bgColor={getStatusColor(subtask.statusId)}
                          size="sm"
                          className="px-1.5 py-0.5 text-[10px] h-5 min-h-0"
                        />
                        {subtask.dueDate && (
                          <Tooltip content={t("subtasks.dueDate")} position="top" color="primary">
                            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                              <HiCalendar className="w-3 h-3" />
                              {formatDateForDisplay(subtask.dueDate, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Component */}
        {Array.isArray(subtTask) && subtTask.length > 0 && subtaskPagination && (
          <Pagination
            pagination={subtaskPagination}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}

        {/* Empty State */}
        {!isLoading && Array.isArray(subtTask) && subtTask.length === 0 && (
          <div className="text-center py-8 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
            <HiListBullet className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">{t("subtasks.noSubtasks")}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("subtasks.addSubtaskDescription")}
            </p>
          </div>
        )}

        {/* Add Subtask Form/Button */}
        {isAddingSubtask ? (
          <form
            onSubmit={handleAddSubtask}
            className="space-y-3 p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]"
          >
            <Input
              type="text"
              value={newSubtaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewSubtaskTitle(e.target.value)
              }
              placeholder={t("subtasks.enterTitle")}
              className="h-9 border-input bg-background text-[var(--foreground)]"
              autoFocus
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="subtask-priority" className="text-xs font-medium">
                  {t("subtasks.priority")}
                </Label>
                <Select
                  value={subtaskPriority}
                  onValueChange={setSubtaskPriority}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full h-8 text-xs  border-[var(--border)] bg-[var(--background)]">
                    <SelectValue placeholder={t("subtasks.selectPriority")} />
                  </SelectTrigger>
                  <SelectContent className="border-none bg-[var(--card)]">
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hover:bg-[var(--hover-bg)] text-xs"
                      >
                        <div className="flex items-center gap-2">{option.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasAccess && (
                <div className="flex justify-end w-full">
                  <ActionButton
                    type="submit"
                    disabled={!newSubtaskTitle.trim() || isLoading}
                    primary
                    showPlusIcon
                  >
                    {isLoading ? t("subtasks.adding") : t("subtasks.add")}
                  </ActionButton>
                </div>
              )}

              <ActionButton
                type="button"
                onClick={handleCancelAddSubtask}
                variant="outline"
                disabled={isLoading}
                secondary
                className="cursor-pointer"
              >
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : hasAccess && isAuth ? (
          <div className="flex justify-end items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenAiModal}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-medium border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 h-9 px-3"
            >
              <HiSparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>{t("subtasks.aiBreakdown.button")}</span>
            </Button>
            <ActionButton
              onClick={() => setIsAddingSubtask(true)}
              variant="outline"
              disabled={isLoading}
              showPlusIcon
              primary
              className="min-w-[160px]"
            >
              {t("subtasks.add")}
            </ActionButton>
          </div>
        ) : null}
      </div>

      {/* AI Settings Modal if user clicks to configure API Key */}
      <AISettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => {
          setIsAiSettingsOpen(false);
          setAiError(null);
        }}
      />

      {/* AI Task Breakdown Modal */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <HiSparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">
                  {t("subtasks.aiBreakdown.modalTitle")}
                </DialogTitle>
                <DialogDescription className="text-xs text-[var(--muted-foreground)]">
                  {t("subtasks.aiBreakdown.modalSubtitle")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Parent Task Context Preview */}
            <div className="p-3 bg-[var(--muted)]/40 rounded-lg border border-[var(--border)] space-y-1">
              <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Parent Task
              </div>
              <div className="text-sm font-medium text-[var(--foreground)]">
                {parentTitle || taskId}
              </div>
              {parentDescription && (
                <div className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">
                  {parentDescription}
                </div>
              )}
            </div>

            {/* Error / Missing Key Banner */}
            {aiError === "AI_API_KEY_MISSING" ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <HiKey className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {t("subtasks.aiBreakdown.missingKeyTitle")}
                </div>
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300/90">
                  {t("subtasks.aiBreakdown.missingKeyDescription")}
                </p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAiSettingsOpen(true)}
                    className="h-8 text-xs font-medium border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                  >
                    <HiCog6Tooth className="w-3.5 h-3.5 mr-1.5" />
                    {t("subtasks.aiBreakdown.openSettings")}
                  </Button>
                </div>
              </div>
            ) : aiError ? (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
                {aiError}
              </div>
            ) : null}

            {/* Configuration Controls (Count & Optional Guidance) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {t("subtasks.aiBreakdown.countLabel")}
                </Label>
                <Select
                  value={aiSubtaskCount.toString()}
                  onValueChange={(val) => setAiSubtaskCount(parseInt(val, 10))}
                  disabled={isAiGenerating || isAiCreating}
                >
                  <SelectTrigger className="h-8 text-xs bg-[var(--background)] border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)]">
                    <SelectItem value="3">3 Subtasks</SelectItem>
                    <SelectItem value="4">4 Subtasks</SelectItem>
                    <SelectItem value="5">5 Subtasks</SelectItem>
                    <SelectItem value="6">6 Subtasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">
                  {t("subtasks.aiBreakdown.guidanceLabel")}
                </Label>
                <Input
                  value={aiUserPrompt}
                  onChange={(e) => setAiUserPrompt(e.target.value)}
                  placeholder={t("subtasks.aiBreakdown.guidancePlaceholder")}
                  className="h-8 text-xs bg-[var(--background)] border-[var(--border)]"
                  disabled={isAiGenerating || isAiCreating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAiGenerating) {
                      handleGenerateAiSubtasks();
                    }
                  }}
                />
              </div>
            </div>

            {/* Generate Trigger Button (if no generated subtasks yet) */}
            {generatedSubtasks.length === 0 && (
              <div className="pt-2">
                <Button
                  onClick={handleGenerateAiSubtasks}
                  disabled={isAiGenerating || isAiCreating}
                  className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium gap-2 shadow-sm transition-all"
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("subtasks.aiBreakdown.generating")}</span>
                    </>
                  ) : (
                    <>
                      <HiSparkles className="w-4 h-4" />
                      <span>{t("subtasks.aiBreakdown.generateButton")}</span>
                    </>
                  )}
                </Button>
                {isAiGenerating && (
                  <p className="text-[11px] text-center text-[var(--muted-foreground)] mt-2 italic">
                    {t("subtasks.aiBreakdown.generatingTip")}
                  </p>
                )}
              </div>
            )}

            {/* Generated Subtasks Review List */}
            {generatedSubtasks.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>
                    {t("subtasks.aiBreakdown.selectedCount", {
                      selected: generatedSubtasks.filter((s) => s.selected).length,
                      total: generatedSubtasks.length,
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {generatedSubtasks.every((s) => s.selected)
                        ? t("subtasks.aiBreakdown.deselectAll")
                        : t("subtasks.aiBreakdown.selectAll")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {generatedSubtasks.map((sub, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleSelectSubtask(idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        sub.selected
                          ? "border-purple-500/50 bg-purple-500/5 dark:bg-purple-500/10"
                          : "border-[var(--border)] bg-[var(--card)] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={sub.selected}
                          onChange={() => handleToggleSelectSubtask(idx)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <Input
                            value={sub.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleSubtaskTitleChange(idx, e.target.value)}
                            className="h-7 text-xs font-medium bg-transparent border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] px-1 -mx-1"
                          />
                          {sub.description && (
                            <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                              {sub.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <DynamicBadge
                              label={sub.priority}
                              bgColor={getPriorityColor(sub.priority)}
                              size="sm"
                              className="px-1.5 py-0.2 text-[9px] h-4 min-h-0"
                            />
                            {sub.estimatedPoints && (
                              <span className="text-[10px] text-[var(--muted-foreground)] px-1.5 py-0.5 rounded bg-[var(--muted)]">
                                {sub.estimatedPoints} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            {generatedSubtasks.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAiSubtasks}
                  disabled={isAiGenerating || isAiCreating}
                  className="h-8 text-xs gap-1.5"
                >
                  <HiArrowPath className={`w-3.5 h-3.5 ${isAiGenerating ? "animate-spin" : ""}`} />
                  <span>{t("subtasks.aiBreakdown.regenerate")}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAiModalOpen(false)}
                    disabled={isAiCreating}
                    className="h-8 text-xs"
                  >
                    {t("subtasks.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAndCreateSubtasks}
                    disabled={
                      isAiCreating ||
                      generatedSubtasks.filter((s) => s.selected && s.title.trim()).length === 0
                    }
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium gap-1.5"
                  >
                    {isAiCreating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("subtasks.aiBreakdown.creating")}</span>
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-3.5 h-3.5" />
                        <span>
                          {t("subtasks.aiBreakdown.createButton", {
                            count: generatedSubtasks.filter((s) => s.selected && s.title.trim()).length,
                          })}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(false)}
                  className="h-8 text-xs"
                >
                  {t("subtasks.cancel")}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

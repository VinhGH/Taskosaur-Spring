import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useNotification } from "@/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HiBell,
  HiCheck,
  HiTrash,
  HiCheckCircle,
  HiClock,
  HiFolder,
  HiSparkles,
  HiChatBubbleLeftEllipsis,
  HiClipboardDocumentCheck,
  HiEnvelope,
  HiStar,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowTopRightOnSquare,
  HiXMark,
  HiPaperAirplane,
  HiArrowPath,
} from "react-icons/hi2";
import { notificationApi } from "@/utils/api/notificationApi";
import { invitationApi } from "@/utils/api/invitationsApi";
import Pagination from "@/components/common/Pagination";
import ErrorState from "@/components/common/ErrorState";
import { Notification, NotificationPriority, NotificationType, NotificationCategory } from "@/types";
import { toast } from "sonner";
import NotificationSkeleton from "../skeletons/NotificationSkeleton";
import Tooltip from "../common/ToolTip";

interface NotificationScreenProps {
  userId: string;
  organizationId: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function getTimelineGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() >= today.getTime()) return "Hôm nay";
  if (target.getTime() >= yesterday.getTime()) return "Hôm qua";
  if (target.getTime() >= thisWeekStart.getTime()) return "Tuần này";
  return "Cũ hơn";
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "vừa xong";
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function cleanNotificationTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  return rawTitle.replace(/^[🚨⚡📌💬🚀\s]+/, "").trim();
}

export default function NotificationScreen({ userId, organizationId }: NotificationScreenProps) {
  const router = useRouter();
  const {
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    isDnd,
    toggleDnd,
    starredIds,
    toggleStar,
    isStarred,
    aiCatchup,
    isCatchupLoading,
    fetchAiCatchup,
  } = useNotification();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Quick Action States
  const [quickReplyId, setQuickReplyId] = useState<string | null>(null);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  // Slide-over Quick Preview Drawer
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);

  // Pagination & Stats
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
  });

  const fetchNotifications = useCallback(async () => {
    if (!userId || !organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const categoryParam = activeCategory === "starred" ? undefined : activeCategory;
      const isReadParam = unreadOnly ? false : undefined;

      const response = await notificationApi.getNotificationsByUserAndOrganization(
        userId,
        organizationId,
        {
          page: currentPage,
          limit: pageSize,
          category: categoryParam !== "all" ? categoryParam : undefined,
          isRead: isReadParam,
        }
      );

      let list = response?.notifications || [];

      // Filter locally for starred if selected
      if (activeCategory === "starred") {
        list = list.filter((n) => starredIds.includes(n.id));
      }

      setNotifications(list);
      setPagination(
        response?.pagination || {
          currentPage,
          totalPages: 1,
          totalCount: list.length,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
      setStats({
        total: response?.summary?.total ?? list.length,
        unread: response?.summary?.unread ?? 0,
      });
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err?.message || "Không thể tải danh sách thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId, currentPage, pageSize, activeCategory, unreadOnly, starredIds]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getVisuals = (type: NotificationType, priority: NotificationPriority) => {
    const isUrgent = priority === "URGENT" || priority === "HIGH" || type === "TASK_DUE_SOON";

    switch (type) {
      case "TASK_ASSIGNED":
        return {
          icon: HiClipboardDocumentCheck,
          iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          label: "Giao việc",
        };
      case "TASK_COMMENTED":
      case "MENTION":
        return {
          icon: HiChatBubbleLeftEllipsis,
          iconBg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
          label: type === "MENTION" ? "Đề cập" : "Bình luận",
        };
      case "TASK_DUE_SOON":
        return {
          icon: HiClock,
          iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          label: "Hạn chót",
        };
      case "WORKSPACE_INVITED":
        return {
          icon: HiEnvelope,
          iconBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
          label: "Lời mời",
        };
      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
        return {
          icon: HiFolder,
          iconBg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          label: "Dự án",
        };
      default:
        return {
          icon: isUrgent ? HiClock : HiBell,
          iconBg: isUrgent
            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          label: isUrgent ? "Khẩn cấp" : "Thông báo",
        };
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    }
    // Open Quick Preview Drawer
    setPreviewNotification(notification);
  };

  const handleNavigateDirect = (notification: Notification) => {
    const actionUrl = notification.actionUrl;
    if (actionUrl) {
      try {
        const targetUrl =
          actionUrl.startsWith("http://") || actionUrl.startsWith("https://")
            ? new URL(actionUrl).pathname + new URL(actionUrl).search
            : actionUrl;
        router.push(targetUrl);
        return;
      } catch {
        router.push(actionUrl);
        return;
      }
    }

    if (notification.entityType === "task" && notification.entityId) {
      router.push(`/tasks/${notification.entityId}`);
    } else if (notification.entityType === "project" && notification.entityId) {
      router.push(`/projects/${notification.entityId}`);
    } else if (notification.entityType === "workspace" && notification.entityId) {
      router.push(`/workspaces/${notification.entityId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBulkMarkRead = async () => {
    const ids = Array.from(selectedNotifications);
    if (ids.length === 0) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setSelectedNotifications(new Set());
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - ids.length) }));
      await Promise.all(ids.map((id) => markAsRead(id)));
      toast.success(`Đã đánh dấu ${ids.length} thông báo là đã đọc`);
      refreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật trạng thái đã đọc.");
      fetchNotifications();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedNotifications);
    if (ids.length === 0) return;
    try {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedNotifications(new Set());
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - ids.length),
      }));
      await notificationApi.deleteMultipleNotifications(ids);
      toast.success(`Đã xoá ${ids.length} thông báo`);
      refreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xoá thông báo.");
      fetchNotifications();
    }
  };

  const handleSingleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setSelectedNotifications((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      await notificationApi.deleteNotification(notificationId);
      toast.success("Đã xoá thông báo");
      refreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xoá thông báo.");
      fetchNotifications();
    }
  };

  const handleQuickReplySubmit = async (e: React.FormEvent, notification: Notification) => {
    e.preventDefault();
    if (!quickReplyText.trim() || !notification.entityId) return;

    try {
      setIsSubmittingReply(true);
      await notificationApi.quickReplyComment(notification.entityId, quickReplyText.trim());
      toast.success("Đã gửi phản hồi bình luận thành công!");
      setQuickReplyId(null);
      setQuickReplyText("");
      if (!notification.isRead) {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi phản hồi.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleRespondInvite = async (
    e: React.MouseEvent,
    notification: Notification,
    accept: boolean
  ) => {
    e.stopPropagation();
    try {
      setProcessingInviteId(notification.id);
      const token = notification.entityId || notification.id;
      if (accept) {
        await invitationApi.acceptInvitation(token);
        toast.success("Đã chấp nhận lời mời tham gia!");
      } else {
        await invitationApi.declineInvitation(token);
        toast.info("Đã từ chối lời mời.");
      }
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xử lý lời mời.");
    } finally {
      setProcessingInviteId(null);
    }
  };

  // Group notifications by Timeline
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      "Hôm nay": [],
      "Hôm qua": [],
      "Tuần này": [],
      "Cũ hơn": [],
    };

    notifications.forEach((n) => {
      const groupName = getTimelineGroup(n.createdAt);
      if (groups[groupName]) {
        groups[groupName].push(n);
      } else {
        groups["Cũ hơn"].push(n);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [notifications]);

  return (
    <div className="dashboard-container min-h-[90vh] flex flex-col space-y-4 max-w-7xl mx-auto px-4 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--border)]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Thông báo
            </h1>
            {stats.unread > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              >
                {stats.unread} chưa đọc
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Xem và xử lý các cập nhật trong tổ chức của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* DND Mode */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDnd}
            className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg border ${
              isDnd
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "border-[var(--border)] text-[var(--foreground)]"
            }`}
          >
            {isDnd ? <HiSpeakerXMark className="w-3.5 h-3.5" /> : <HiSpeakerWave className="w-3.5 h-3.5" />}
            <span>{isDnd ? "Đang tắt chuông" : "Không làm phiền"}</span>
          </Button>

          {/* Mark All Read */}
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-[var(--border)] text-[var(--foreground)] hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            >
              <HiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đánh dấu tất cả đã đọc</span>
            </Button>
          )}

          {/* Refresh */}
          <Tooltip content="Làm mới">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchNotifications}
              className="h-8 w-8 rounded-lg hover:bg-[var(--accent)]"
            >
              <HiArrowPath className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* AI Digest Banner - Sleek, understated design */}
      <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <HiSparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Tóm tắt thông báo
                </span>
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.2 rounded">
                  AI Digest
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Tự động tổng hợp các cập nhật quan trọng từ thông báo gần đây.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isCatchupLoading}
            onClick={() => fetchAiCatchup()}
            className="h-7 px-3 text-xs font-medium rounded-lg border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)] flex items-center gap-1.5"
          >
            {isCatchupLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <HiSparkles className="w-3 h-3 text-[var(--primary)]" />
                <span>{aiCatchup ? "Cập nhật tóm tắt" : "Tóm tắt thông minh"}</span>
              </>
            )}
          </Button>
        </div>

        {aiCatchup && (
          <div className="pt-2 border-t border-[var(--border)]/50 space-y-2 animate-in fade-in-50">
            <p className="text-xs text-[var(--foreground)] leading-relaxed">
              {aiCatchup.summary}
            </p>
            {aiCatchup.highlights && aiCatchup.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {aiCatchup.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded-md bg-[var(--muted)]/40 border border-[var(--border)]/40 text-[11px] text-[var(--foreground)] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                    <span className="line-clamp-1">{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Category Tabs (NO EMOJIS) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]/40 w-fit">
          {[
            { key: "all", label: "Tất cả" },
            { key: "assigned", label: "Giao cho tôi" },
            { key: "urgent", label: "Khẩn cấp" },
            { key: "discussions", label: "Thảo luận" },
            { key: "starred", label: "Đã lưu" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveCategory(tab.key as NotificationCategory);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === tab.key
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold border border-[var(--border)]/60"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Unread Only & Bulk */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
            />
            <span className="font-medium">Chỉ hiện chưa đọc</span>
          </label>

          {/* Bulk Actions Toolbar */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in-50">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkRead}
                className="h-7 px-2.5 text-xs rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                <HiCheck className="w-3.5 h-3.5 mr-1" />
                <span>Đã đọc ({selectedNotifications.size})</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-7 px-2.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                <HiTrash className="w-3.5 h-3.5 mr-1" />
                <span>Xoá ({selectedNotifications.size})</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[400px]">
        {loading ? (
          <NotificationSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchNotifications} />
        ) : notifications.length === 0 ? (
          /* Clean Empty State */
          <div className="py-20 px-4 text-center space-y-3 bg-[var(--card)]/30 border border-dashed border-[var(--border)] rounded-2xl mt-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] flex items-center justify-center text-xl">
              <HiBell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Không có thông báo nào
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
              Bạn đã xử lý hết các cập nhật trong danh mục này.
            </p>
            {activeCategory !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="mt-2 text-xs rounded-lg"
              >
                Xem tất cả thông báo
              </Button>
            )}
          </div>
        ) : (
          /* Timeline-Grouped Notification List */
          <div className="space-y-5 mt-2">
            {groupedNotifications.map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                {/* Timeline Header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)] tracking-wide uppercase">
                    {groupName}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]/40" />
                  <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                    {items.length}
                  </span>
                </div>

                {/* Notification Cards */}
                <div className="space-y-1.5">
                  {items.map((notification) => {
                    const { icon: Icon, iconBg, label } = getVisuals(
                      notification.type,
                      notification.priority
                    );
                    const isUnread = !notification.isRead;
                    const isSelected = selectedNotifications.has(notification.id);
                    const isStarredItem = isStarred(notification.id);
                    const isReplying = quickReplyId === notification.id;
                    const cleanTitle = cleanNotificationTitle(notification.title);

                    return (
                      <div
                        key={notification.id}
                        className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--accent)] border-[var(--primary)]/40"
                            : isUnread
                            ? "bg-[var(--card)] border-[var(--border)] shadow-xs hover:border-[var(--primary)]/30"
                            : "bg-[var(--card)]/50 border-[var(--border)]/40 hover:border-[var(--border)] hover:bg-[var(--card)]"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-0.5 flex-shrink-0"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedNotifications);
                                if (e.target.checked) newSet.add(notification.id);
                                else newSet.delete(notification.id);
                                setSelectedNotifications(newSet);
                              }}
                              className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
                            />
                          </div>

                          {/* Visual Icon (Subtle & Clean) */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs ${iconBg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            {isUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-[var(--card)]" />
                            )}
                          </div>

                          {/* Center Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              {/* Non-redundant category and priority tags */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                                  {label}
                                </span>
                                {notification.priority === "URGENT" && label !== "Khẩn cấp" && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    Khẩn cấp
                                  </span>
                                )}
                                {notification.priority === "HIGH" && label !== "Khẩn cấp" && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    Ưu tiên cao
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>

                            <h4
                              className={`text-xs mt-0.5 leading-snug ${
                                isUnread
                                  ? "font-bold text-[var(--foreground)]"
                                  : "font-medium text-[var(--muted-foreground)]"
                              }`}
                            >
                              {cleanTitle}
                            </h4>

                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* In-line Workspace Invite Actions */}
                            {notification.type === "WORKSPACE_INVITED" && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]/40"
                              >
                                <Button
                                  size="sm"
                                  disabled={processingInviteId === notification.id}
                                  onClick={(e) => handleRespondInvite(e, notification, true)}
                                  className="h-6 px-2.5 text-[10px] rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                >
                                  Chấp nhận lời mời
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={processingInviteId === notification.id}
                                  onClick={(e) => handleRespondInvite(e, notification, false)}
                                  className="h-6 px-2.5 text-[10px] rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            )}

                            {/* In-line Comment Quick Reply Form */}
                            {(notification.type === "TASK_COMMENTED" ||
                              notification.type === "MENTION") && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2"
                              >
                                {!isReplying ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickReplyId(notification.id);
                                      setQuickReplyText("");
                                    }}
                                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <HiChatBubbleLeftEllipsis className="w-3 h-3" />
                                    <span>Trả lời nhanh...</span>
                                  </button>
                                ) : (
                                  <form
                                    onSubmit={(e) => handleQuickReplySubmit(e, notification)}
                                    className="p-2.5 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]/60 space-y-2 mt-1"
                                  >
                                    <textarea
                                      value={quickReplyText}
                                      onChange={(e) => setQuickReplyText(e.target.value)}
                                      placeholder="Nhập nội dung phản hồi..."
                                      rows={2}
                                      className="w-full text-xs p-2 rounded-md bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setQuickReplyId(null)}
                                        className="h-6 px-2 text-xs text-[var(--muted-foreground)]"
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmittingReply || !quickReplyText.trim()}
                                        className="h-6 px-2.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                                      >
                                        <HiPaperAirplane className="w-3 h-3" />
                                        <span>Gửi</span>
                                      </Button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hover Action Cluster (Star, Open, Mark Read, Delete) */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            {/* Star Button */}
                            <Tooltip content={isStarredItem ? "Bỏ lưu" : "Lưu lại"}>
                              <button
                                type="button"
                                onClick={() => toggleStar(notification.id)}
                                className={`p-1 rounded-md transition-colors ${
                                  isStarredItem
                                    ? "text-amber-500 bg-amber-500/10"
                                    : "text-[var(--muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10"
                                }`}
                              >
                                <HiStar className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>

                            {/* Direct Open */}
                            <Tooltip content="Mở trang chi tiết">
                              <button
                                type="button"
                                onClick={() => handleNavigateDirect(notification)}
                                className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                              >
                                <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>

                            {/* Mark Read */}
                            {isUnread && (
                              <Tooltip content="Đánh dấu đã đọc">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await markAsRead(notification.id);
                                    setNotifications((prev) =>
                                      prev.map((n) =>
                                        n.id === notification.id ? { ...n, isRead: true } : n
                                      )
                                    );
                                  }}
                                  className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <HiCheck className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            )}

                            {/* Delete Button */}
                            <Tooltip content="Xoá thông báo">
                              <button
                                type="button"
                                onClick={(e) => handleSingleDelete(e, notification.id)}
                                className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <HiTrash className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Pagination */}
      <div className="sticky bottom-0 z-20 py-2 bg-[var(--background)]/90 backdrop-blur-md border-t border-[var(--border)]/50">
        <Pagination
          pagination={pagination}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedNotifications(new Set());
          }}
          itemType="thông báo"
        />
      </div>

      {/* Slide-over Quick Preview Drawer */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in-20">
          <div
            className="w-full max-w-lg h-full bg-[var(--card)] border-l border-[var(--border)] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-10 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Chi tiết thông báo
                  </span>
                  {previewNotification.priority === "URGENT" && (
                    <Badge variant="destructive" className="text-[10px] font-medium">
                      Khẩn cấp
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewNotification(null)}
                  className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-[var(--foreground)] leading-snug">
                  {cleanNotificationTitle(previewNotification.title)}
                </h2>

                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>{formatRelativeTime(previewNotification.createdAt)}</span>
                  <span>•</span>
                  <span>{getVisuals(previewNotification.type, previewNotification.priority).label}</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]/40 text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                  {previewNotification.message}
                </div>

                {previewNotification.createdByUser && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)]/60">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs">
                      {previewNotification.createdByUser.firstName?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">
                        {previewNotification.createdByUser.firstName}{" "}
                        {previewNotification.createdByUser.lastName}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">Người gửi</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-[var(--border)]/60 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewNotification(null)}
                className="h-8 px-3 text-xs rounded-lg"
              >
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    handleSingleDelete(e, previewNotification.id);
                    setPreviewNotification(null);
                  }}
                  className="h-8 px-2.5 text-xs rounded-lg text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30"
                >
                  <HiTrash className="w-3.5 h-3.5 mr-1" />
                  <span>Xoá</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const target = previewNotification;
                    setPreviewNotification(null);
                    handleNavigateDirect(target);
                  }}
                  className="h-8 px-3 text-xs rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white flex items-center gap-1.5"
                >
                  <span>Mở trang chi tiết</span>
                  <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

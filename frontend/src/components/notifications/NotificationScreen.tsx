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
  HiCog6Tooth,
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
  HiFunnel,
  HiBookmark,
} from "react-icons/hi2";
import { notificationApi } from "@/utils/api/notificationApi";
import { invitationApi } from "@/utils/api/invitationsApi";
import { PageHeader } from "@/components/common/PageHeader";
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
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          label: "Giao việc",
        };
      case "TASK_COMMENTED":
      case "MENTION":
        return {
          icon: HiChatBubbleLeftEllipsis,
          iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          label: type === "MENTION" ? "@Nhắc đến" : "Bình luận",
        };
      case "TASK_DUE_SOON":
        return {
          icon: HiClock,
          iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          label: "Sắp hết hạn",
        };
      case "WORKSPACE_INVITED":
        return {
          icon: HiEnvelope,
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "Lời mời",
        };
      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
        return {
          icon: HiFolder,
          iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
          label: "Dự án",
        };
      default:
        return {
          icon: isUrgent ? HiClock : HiCog6Tooth,
          iconBg: isUrgent
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
          label: isUrgent ? "Khẩn cấp" : "Hệ thống",
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
      await Promise.all(ids.map((id) => markAsRead(id)));
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setSelectedNotifications(new Set());
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - ids.length) }));
      toast.success(`Đã đánh dấu ${ids.length} thông báo là đã đọc`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật trạng thái đã đọc.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedNotifications);
    if (ids.length === 0) return;
    try {
      await notificationApi.deleteMultipleNotifications(ids);
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedNotifications(new Set());
      toast.success(`Đã xoá ${ids.length} thông báo`);
      fetchNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xoá thông báo.");
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
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Hộp thư Thông báo
            </h1>
            {stats.unread > 0 && (
              <Badge
                variant="destructive"
                className="rounded-full px-2.5 py-0.5 text-xs font-bold shadow-xs"
              >
                {stats.unread} chưa đọc
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Trung tâm điều hướng, phân loại và xử lý công việc tức thì của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* DND Mode */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDnd}
            className={`h-9 px-3 text-xs gap-1.5 rounded-xl border ${
              isDnd
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "border-[var(--border)] text-[var(--foreground)]"
            }`}
          >
            {isDnd ? <HiSpeakerXMark className="w-4 h-4" /> : <HiSpeakerWave className="w-4 h-4" />}
            <span>{isDnd ? "Đang bật DND" : "Không làm phiền"}</span>
          </Button>

          {/* Mark All Read */}
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-9 px-3 text-xs gap-1.5 rounded-xl border-[var(--border)] text-[var(--foreground)] hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            >
              <HiCheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Đánh dấu tất cả đã đọc</span>
            </Button>
          )}

          {/* Refresh */}
          <Tooltip content="Làm mới">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchNotifications}
              className="h-9 w-9 rounded-xl hover:bg-[var(--accent)]"
            >
              <HiArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ✨ AI Catch-up Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/25 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <HiSparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                AI Catch-up Digest
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Bản tin tóm tắt thông minh
                </span>
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Tự động gom và tổng hợp các việc trọng tâm từ thông báo của bạn.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            disabled={isCatchupLoading}
            onClick={() => fetchAiCatchup()}
            className="h-8 px-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm flex items-center gap-1.5"
          >
            {isCatchupLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <HiSparkles className="w-3.5 h-3.5" />
                <span>{aiCatchup ? "Cập nhật tóm tắt" : "Tóm tắt ngay bằng AI"}</span>
              </>
            )}
          </Button>
        </div>

        {aiCatchup && (
          <div className="pt-2 border-t border-blue-500/20 space-y-2 animate-in fade-in-50">
            <p className="text-xs text-[var(--foreground)] leading-relaxed font-medium">
              {aiCatchup.summary}
            </p>
            {aiCatchup.highlights && aiCatchup.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {aiCatchup.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-[var(--card)]/80 border border-[var(--border)]/40 text-[11px] text-[var(--foreground)] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="line-clamp-1">{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Filter Tabs & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)]/40 w-fit">
          {[
            { key: "all", label: "Tất cả" },
            { key: "assigned", label: "🎯 Giao cho tôi & @Me" },
            { key: "urgent", label: "⚡ Khẩn cấp & Deadline" },
            { key: "discussions", label: "💬 Thảo luận" },
            { key: "starred", label: "⭐ Đã ghim" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveCategory(tab.key as NotificationCategory);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === tab.key
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs border border-[var(--border)]/50"
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

          {/* Bulk Actions Floating Toolbar */}
          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in-50">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkRead}
                className="h-8 px-2.5 text-xs rounded-xl text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                <HiCheck className="w-3.5 h-3.5 mr-1" />
                <span>Đã đọc ({selectedNotifications.size})</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-8 px-2.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
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
          /* Inbox Zero State */
          <div className="py-20 px-4 text-center space-y-3 bg-[var(--card)]/40 border border-dashed border-[var(--border)] rounded-3xl mt-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-sm">
              <HiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              Inbox Zero! Bạn đã cập nhật tất cả.
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
              Không có thông báo nào cần giải quyết trong danh mục này. Hãy thư giãn hoặc bắt tay vào các mục tiêu lớn tiếp theo!
            </p>
            {activeCategory !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="mt-2 text-xs rounded-xl"
              >
                Xem tất cả thông báo
              </Button>
            )}
          </div>
        ) : (
          /* Timeline-Grouped Notification List */
          <div className="space-y-6 mt-2">
            {groupedNotifications.map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                {/* Timeline Header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {groupName}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]/50" />
                  <span className="text-[11px] text-[var(--muted-foreground)] font-medium">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map((notification) => {
                    const { icon: Icon, iconBg, label } = getVisuals(
                      notification.type,
                      notification.priority
                    );
                    const isUnread = !notification.isRead;
                    const isSelected = selectedNotifications.has(notification.id);
                    const isStarredItem = isStarred(notification.id);
                    const isReplying = quickReplyId === notification.id;

                    return (
                      <div
                        key={notification.id}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--accent)] border-[var(--primary)]/50"
                            : isUnread
                            ? "bg-[var(--card)] border-blue-500/20 shadow-xs hover:border-blue-500/40 hover:shadow-md"
                            : "bg-[var(--card)]/60 border-[var(--border)]/60 hover:border-[var(--border)] hover:bg-[var(--card)]"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-1 flex-shrink-0"
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
                              className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
                            />
                          </div>

                          {/* Visual Icon */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconBg}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            {isUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-[var(--card)] animate-pulse" />
                            )}
                          </div>

                          {/* Center Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                                  {label}
                                </span>
                                {(notification.priority === "URGENT" ||
                                  notification.priority === "HIGH") && (
                                  <Badge
                                    variant="destructive"
                                    className="px-1.5 py-0 text-[10px] font-bold rounded-md"
                                  >
                                    {notification.priority === "URGENT" ? "Khẩn cấp" : "Ưu tiên cao"}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>

                            <h4
                              className={`text-sm mt-1 leading-snug ${
                                isUnread
                                  ? "font-bold text-[var(--foreground)]"
                                  : "font-medium text-[var(--muted-foreground)]"
                              }`}
                            >
                              {notification.title}
                            </h4>

                            <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* In-line Workspace Invite Actions */}
                            {notification.type === "WORKSPACE_INVITED" && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border)]/40"
                              >
                                <Button
                                  size="sm"
                                  disabled={processingInviteId === notification.id}
                                  onClick={(e) => handleRespondInvite(e, notification, true)}
                                  className="h-7 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                >
                                  Chấp nhận lời mời
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={processingInviteId === notification.id}
                                  onClick={(e) => handleRespondInvite(e, notification, false)}
                                  className="h-7 px-3 text-xs rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
                                className="mt-2.5"
                              >
                                {!isReplying ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickReplyId(notification.id);
                                      setQuickReplyText("");
                                    }}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                                  >
                                    <HiChatBubbleLeftEllipsis className="w-3.5 h-3.5" />
                                    <span>Trả lời nhanh tại đây...</span>
                                  </button>
                                ) : (
                                  <form
                                    onSubmit={(e) => handleQuickReplySubmit(e, notification)}
                                    className="p-3 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]/60 space-y-2 mt-1"
                                  >
                                    <textarea
                                      value={quickReplyText}
                                      onChange={(e) => setQuickReplyText(e.target.value)}
                                      placeholder="Nhập nội dung phản hồi của bạn..."
                                      rows={2}
                                      className="w-full text-xs p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setQuickReplyId(null)}
                                        className="h-7 px-2.5 text-xs text-[var(--muted-foreground)]"
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmittingReply || !quickReplyText.trim()}
                                        className="h-7 px-3 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
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

                          {/* Hover Action Cluster */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            {/* Star Button */}
                            <Tooltip content={isStarredItem ? "Bỏ ghim" : "Ghim thông báo"}>
                              <button
                                type="button"
                                onClick={() => toggleStar(notification.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isStarredItem
                                    ? "text-amber-500 bg-amber-500/10"
                                    : "text-[var(--muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10"
                                }`}
                              >
                                <HiStar className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            {/* Direct Open */}
                            <Tooltip content="Mở trang đầy đủ">
                              <button
                                type="button"
                                onClick={() => handleNavigateDirect(notification)}
                                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                              >
                                <HiArrowTopRightOnSquare className="w-4 h-4" />
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
                                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <HiCheck className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            )}
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-20">
          <div
            className="w-full max-w-lg h-full bg-[var(--card)] border-l border-[var(--border)] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-10 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Chi tiết thông báo
                  </Badge>
                  {previewNotification.priority === "URGENT" && (
                    <Badge variant="destructive" className="text-xs">
                      Khẩn cấp
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewNotification(null)}
                  className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                  {previewNotification.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>{formatRelativeTime(previewNotification.createdAt)}</span>
                  <span>•</span>
                  <span>Loại: {previewNotification.type}</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]/50 text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                  {previewNotification.message}
                </div>

                {previewNotification.createdByUser && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]/60">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs">
                      {previewNotification.createdByUser.firstName?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">
                        {previewNotification.createdByUser.firstName}{" "}
                        {previewNotification.createdByUser.lastName}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">Người khởi tạo</p>
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
                className="h-9 px-4 text-xs rounded-xl"
              >
                Đóng
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const target = previewNotification;
                  setPreviewNotification(null);
                  handleNavigateDirect(target);
                }}
                className="h-9 px-4 text-xs rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white flex items-center gap-1.5"
              >
                <span>Mở trang chi tiết</span>
                <HiArrowTopRightOnSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

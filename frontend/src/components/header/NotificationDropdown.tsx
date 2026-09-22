import { useState, useEffect, useMemo, useCallback } from "react";
import { useNotification } from "@/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  HiBell,
  HiCheck,
  HiCheckCircle,
  HiClock,
  HiSparkles,
  HiChatBubbleLeftEllipsis,
  HiClipboardDocumentCheck,
  HiEnvelope,
  HiFolder,
  HiCog6Tooth,
  HiStar,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowRight,
  HiChevronDown,
  HiChevronUp,
  HiTrash,
} from "react-icons/hi2";
import { notificationApi } from "@/utils/api/notificationApi";
import { invitationApi } from "@/utils/api/invitationsApi";
import Tooltip from "../common/ToolTip";
import { useRouter } from "next/router";
import { Notification, NotificationType, NotificationPriority } from "@/types/notification";
import { toast } from "sonner";

interface NotificationDropdownProps {
  userId?: string;
  organizationId?: string;
  className?: string;
}

type TabFilter = "unread" | "urgent" | "all";

export default function NotificationDropdown({
  userId,
  organizationId,
  className = "",
}: NotificationDropdownProps) {
  const {
    unreadCount: globalUnreadCount,
    recentNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
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
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("unread");
  const [isCatchupExpanded, setIsCatchupExpanded] = useState(false);
  const router = useRouter();

  // Sync with real-time recent notifications from context
  useEffect(() => {
    if (recentNotifications && recentNotifications.length > 0) {
      setNotifications(recentNotifications);
    }
  }, [recentNotifications]);

  // Fetch when dropdown opens
  useEffect(() => {
    const fetchDropdownNotifications = async () => {
      if (!dropdownOpen || !userId) return;
      refreshNotifications();

      try {
        setLoading(true);
        const response = organizationId
          ? await notificationApi.getNotificationsByUserAndOrganization(
              userId,
              organizationId,
              {
                page: 1,
                limit: 15,
              }
            )
          : await notificationApi.getUserNotifications({
              page: 1,
              limit: 15,
            });

        setNotifications(response.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications for dropdown:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownNotifications();
  }, [userId, organizationId, dropdownOpen, refreshNotifications]);

  // Filter items based on selected tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab === "urgent") {
      return notifications.filter(
        (n) =>
          n.priority === "URGENT" ||
          n.priority === "HIGH" ||
          n.type === "TASK_DUE_SOON"
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
  };

  const getNotificationVisuals = (type: NotificationType, priority: NotificationPriority) => {
    const isUrgent = priority === "URGENT" || priority === "HIGH" || type === "TASK_DUE_SOON";

    switch (type) {
      case "TASK_ASSIGNED":
        return {
          icon: HiClipboardDocumentCheck,
          iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
          typeLabel: "Giao việc",
        };
      case "TASK_COMMENTED":
      case "MENTION":
        return {
          icon: HiChatBubbleLeftEllipsis,
          iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
          typeLabel: type === "MENTION" ? "@Nhắc đến" : "Bình luận",
        };
      case "TASK_DUE_SOON":
        return {
          icon: HiClock,
          iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
          typeLabel: "Sắp hết hạn",
        };
      case "WORKSPACE_INVITED":
        return {
          icon: HiEnvelope,
          iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
          typeLabel: "Lời mời",
        };
      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
        return {
          icon: HiFolder,
          iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20",
          typeLabel: "Dự án",
        };
      default:
        return {
          icon: isUrgent ? HiClock : HiCog6Tooth,
          iconBg: isUrgent
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
            : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
          typeLabel: isUrgent ? "Quan trọng" : "Hệ thống",
        };
    }
  };

  const handleItemMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      setMarkingAsRead(notificationId);
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      await deleteNotification(notificationId);
      toast.success("Đã xóa thông báo");
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Không thể xóa thông báo");
      refreshNotifications();
    }
  };

  const handleItemClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setDropdownOpen(false);

    const actionUrl = notification.actionUrl;
    if (actionUrl) {
      try {
        const targetUrl =
          actionUrl.startsWith("http://") || actionUrl.startsWith("https://")
            ? new URL(actionUrl).pathname + new URL(actionUrl).search
            : actionUrl;
        router.push(targetUrl);
      } catch {
        router.push(actionUrl);
      }
    } else if (notification.entityType === "task" && notification.entityId) {
      router.push(`/tasks/${notification.entityId}`);
    } else if (notification.entityType === "project" && notification.entityId) {
      router.push(`/projects/${notification.entityId}`);
    }
  };

  const handleTriggerCatchup = async () => {
    setIsCatchupExpanded(true);
    if (!aiCatchup) {
      await fetchAiCatchup();
    }
  };

  const handleRespondInvitation = async (
    e: React.MouseEvent,
    notification: Notification,
    accept: boolean
  ) => {
    e.stopPropagation();
    try {
      setProcessingInvite(notification.id);
      // If notification has entityId or token in actionUrl
      const token = notification.entityId || notification.id;
      if (accept) {
        await invitationApi.acceptInvitation(token);
        toast.success("Đã chấp nhận lời mời tham gia!");
      } else {
        await invitationApi.declineInvitation(token);
        toast.info("Đã từ chối lời mời.");
      }
      await markAsRead(notification.id);
      refreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Không thể phản hồi lời mời.");
    } finally {
      setProcessingInvite(null);
    }
  };

  if (!userId) return null;

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Tooltip content="Thông báo" position="bottom" color="primary">
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`relative w-10 h-10 rounded-full hover:bg-[var(--accent)] transition-all duration-200 ${className}`}
            aria-label="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <HiBell
                className={`w-5 h-5 transition-transform duration-200 ${
                  globalUnreadCount > 0 ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                }`}
              />
              {globalUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--background)] animate-in zoom-in-50">
                  {globalUnreadCount > 99 ? "99+" : globalUnreadCount}
                </span>
              )}
              {isDnd && (
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--background)]" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent
        className="w-[380px] sm:w-[420px] p-0 bg-[var(--card)] border-[var(--border)] shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl animate-in fade-in-80 zoom-in-95"
        align="end"
        sideOffset={8}
      >
        {/* Modern Header */}
        <div className="p-4 pb-3 border-b border-[var(--border)]/60 bg-[var(--card)]/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-[var(--foreground)] tracking-tight">
                Thông báo
              </h3>
              {globalUnreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                >
                  {globalUnreadCount} mới
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* DND Toggle Button */}
              <Tooltip content={isDnd ? "Tắt Không làm phiền" : "Bật Không làm phiền (DND)"} position="bottom">
                <button
                  type="button"
                  onClick={toggleDnd}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDnd
                      ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {isDnd ? <HiSpeakerXMark className="w-4 h-4" /> : <HiSpeakerWave className="w-4 h-4" />}
                </button>
              </Tooltip>

              {/* Mark All Read Button */}
              {globalUnreadCount > 0 && (
                <Tooltip content="Đánh dấu tất cả đã đọc" position="bottom">
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  >
                    <HiCheckCircle className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-all ${
                activeTab === "unread"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Chưa đọc {globalUnreadCount > 0 && `(${globalUnreadCount})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("urgent")}
              className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-all ${
                activeTab === "urgent"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Quan trọng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-all ${
                activeTab === "all"
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* AI Catch-up Card */}
        <div className="px-4 py-2 bg-[var(--muted)]/20 border-b border-[var(--border)]">
          {!isCatchupExpanded ? (
            <button
              type="button"
              onClick={handleTriggerCatchup}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/40 shadow-xs transition-all group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                  <HiSparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    Tóm tắt thông minh
                    <span className="text-[10px] font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.2 rounded">
                      Catch-up
                    </span>
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-1">
                    Nắm bắt tình hình công việc trong ngày
                  </p>
                </div>
              </div>
              <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HiSparkles className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-semibold text-[var(--foreground)]">Bản tin thông minh</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCatchupExpanded(false)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded"
                >
                  <HiChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCatchupLoading ? (
                <div className="py-3 flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Đang phân tích và tóm tắt thông báo...
                </div>
              ) : aiCatchup ? (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    {aiCatchup.summary}
                  </p>
                  {aiCatchup.highlights && aiCatchup.highlights.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[var(--border)]/40">
                      {aiCatchup.highlights.map((item, idx) => (
                        <div key={idx} className="text-[11px] text-[var(--muted-foreground)] flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiCatchup.suggestedActions && aiCatchup.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiCatchup.suggestedActions.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            if (act.actionType === "MARK_ALL_READ") {
                              markAllAsRead();
                            } else if (act.targetUrl) {
                              setDropdownOpen(false);
                              router.push(act.targetUrl);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold transition-colors"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">Chưa có dữ liệu tóm tắt.</p>
              )}
            </div>
          )}
        </div>

        {/* Notifications Scrollable List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-[var(--border)]/40 overscroll-contain scrollbar-none">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--muted-foreground)]">Đang tải thông báo...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-xs">
                <HiCheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-[var(--foreground)]">
                {activeTab === "unread" ? "Tất cả đã được xử lý!" : "Không có thông báo phù hợp"}
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto">
                {activeTab === "unread"
                  ? "Bạn đã cập nhật trọn vẹn mọi thông tin mới nhất. Tiếp tục giữ phong độ nhé!"
                  : "Danh mục này hiện chưa có thông báo nào."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const { icon: Icon, iconBg, typeLabel } = getNotificationVisuals(
                notification.type,
                notification.priority
              );
              const isItemUnread = !notification.isRead;
              const starred = isStarred(notification.id);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`group relative p-3.5 transition-all cursor-pointer hover:bg-[var(--accent)]/40 ${
                    isItemUnread ? "bg-[var(--primary)]/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Visual Icon with soft badge */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border text-sm ${iconBg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isItemUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-[var(--background)] animate-pulse" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <h4
                        className={`text-xs mt-0.5 line-clamp-1 ${
                          isItemUnread
                            ? "font-bold text-[var(--foreground)]"
                            : "font-medium text-[var(--muted-foreground)]"
                        }`}
                      >
                        {notification.title}
                      </h4>

                      <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* In-line Actions for Workspace Invitations */}
                      {notification.type === "WORKSPACE_INVITED" && (
                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-[var(--border)]/30">
                          <Button
                            size="sm"
                            disabled={processingInvite === notification.id}
                            onClick={(e) => handleRespondInvitation(e, notification, true)}
                            className="h-6 px-2.5 text-[10px] rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={processingInvite === notification.id}
                            onClick={(e) => handleRespondInvitation(e, notification, false)}
                            className="h-6 px-2.5 text-[10px] rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Toolbar on Hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(notification.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          starred
                            ? "text-amber-500 hover:bg-amber-500/10"
                            : "text-[var(--muted-foreground)] hover:text-amber-500 hover:bg-amber-500/10"
                        }`}
                        title={starred ? "Bỏ lưu" : "Lưu lại"}
                      >
                        <HiStar className="w-3.5 h-3.5" />
                      </button>

                      {/* Mark Read Button */}
                      {isItemUnread && (
                        <button
                          type="button"
                          disabled={markingAsRead === notification.id}
                          onClick={(e) => handleItemMarkAsRead(e, notification.id)}
                          className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <HiCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, notification.id)}
                        className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa thông báo"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modern Footer */}
        <div className="p-3 border-t border-[var(--border)]/60 bg-[var(--card)]/90 backdrop-blur-md">
          <Button
            variant="ghost"
            onClick={() => {
              setDropdownOpen(false);
              router.push("/notifications");
            }}
            className="w-full h-8 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Mở Notification Hub toàn màn hình</span>
            <HiArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

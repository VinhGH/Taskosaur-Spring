import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { notificationApi } from "@/utils/api/notificationApi";
import { Notification } from "@/types";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { socketService } from "@/lib/socket";
import { toast } from "sonner";
import { useRouter } from "next/router";
import UrgentTaskModal from "@/components/notifications/UrgentTaskModal";

interface NotificationState {
  unreadCount: number;
  unreadCountsByOrg: { organizationId: string; organizationName: string; unreadCount: number }[];
  recentNotifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

interface NotificationContextType extends NotificationState {
  fetchUnreadCount: () => Promise<void>;
  fetchUnreadCountsByOrg: () => Promise<void>;
  fetchRecentNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  // For syncing when other components change state
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

function playEmergencyChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio context may be restricted by browser policy before first interaction
  }
}

function isNotificationUrgent(notification: any): boolean {
  if (!notification) return false;
  const priorityUpper = String(notification.priority || "").toUpperCase();
  if (priorityUpper === "URGENT") return true;

  const titleLower = String(notification.title || "").toLowerCase();
  const messageLower = String(notification.message || "").toLowerCase();

  const urgentKeywords = [
    "khẩn cấp",
    "cao nhất",
    "highest",
    "urgent",
    "báo động",
    "cảnh báo",
    "ưu tiên cao nhất",
  ];

  return (
    urgentKeywords.some((kw) => titleLower.includes(kw)) ||
    urgentKeywords.some((kw) => messageLower.includes(kw))
  );
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    unreadCountsByOrg: [],
    recentNotifications: [],
    isLoading: false,
    error: null,
  });

  const [urgentAlert, setUrgentAlert] = useState<{
    isOpen: boolean;
    notification: any | null;
  }>({
    isOpen: false,
    notification: null,
  });

  const dismissUrgentAlert = useCallback(() => {
    if (urgentAlert.notification?.id && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`seen_urgent_${urgentAlert.notification.id}`, "true");
      } catch (e) {}
    }
    setUrgentAlert({ isOpen: false, notification: null });
  }, [urgentAlert.notification]);

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  const userId = user?.id;
  const organizationId = currentOrganization?.id;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !organizationId) return;
    try {
      const response = await notificationApi.getNotificationsByUserAndOrganization(
        userId,
        organizationId,
        { isRead: false, page: 1, limit: 1 }
      );
      
       // Robust check for count
       let count = 0;
       const paginationTotal = Number(response.pagination?.totalCount);
       const summaryUnread = Number(response.summary?.unread);

       if (!isNaN(paginationTotal)) {
           count = paginationTotal;
       } else if (!isNaN(summaryUnread)) {
           count = summaryUnread;
       }

      setState(prev => ({ ...prev, unreadCount: count }));
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  }, [userId, organizationId]);

  const fetchUnreadCountsByOrg = useCallback(async () => {
    if (!userId) return;
    try {
      const counts = await notificationApi.getUnreadCountsByOrganization();
      setState(prev => ({ ...prev, unreadCountsByOrg: Array.isArray(counts) ? counts : [] }));
    } catch (error) {
      console.error("Failed to fetch unread counts by org", error);
      setState(prev => ({ ...prev, unreadCountsByOrg: [] }));
    }
  }, [userId]);

  const fetchRecentNotifications = useCallback(async () => {
     if (!userId || !organizationId) {
         return;
     }
     try {
       setState(prev => ({ ...prev, isLoading: true }));
       const response = await notificationApi.getNotificationsByUserAndOrganization(
         userId,
         organizationId,
         { isRead: false, page: 1, limit: 5 }
       );

       let count = 0;
       const paginationTotal = Number(response.pagination?.totalCount);
       const summaryUnread = Number(response.summary?.unread);


       if (!isNaN(paginationTotal)) {
           count = paginationTotal;
       } else if (!isNaN(summaryUnread)) {
           count = summaryUnread;
       }

       setState(prev => ({ 
         ...prev, 
         recentNotifications: response.notifications,
         unreadCount: count,
         isLoading: false 
       }));

       // Hiển thị ngay cảnh báo công việc khẩn cấp nếu có thông báo chưa đọc chưa bị đóng trong phiên này
       if (typeof window !== "undefined" && Array.isArray(response.notifications)) {
         const unreadUrgent = response.notifications.find((n: any) => {
           if (n.isRead) return false;
           if (sessionStorage.getItem(`seen_urgent_${n.id}`)) return false;
           return isNotificationUrgent(n);
         });

         if (unreadUrgent) {
           setUrgentAlert({
             isOpen: true,
             notification: unreadUrgent,
           });
           playEmergencyChime();
         }
       }
     } catch (error) {
       console.error("Failed to fetch recent notifications", error);
       setState(prev => ({ ...prev, isLoading: false, error: "Failed to fetch notifications" }));
     }
  }, [userId, organizationId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      // Optimistic update
      setState(prev => ({
        ...prev,
        recentNotifications: prev.recentNotifications.filter(n => n.id !== notificationId),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      fetchUnreadCountsByOrg();
    } catch (error) {
       console.error("Failed to mark notification as read", error);
    }
  }, [fetchUnreadCountsByOrg]);

  const markAllAsRead = useCallback(async () => {
      if (!organizationId) return;
      try {
          await notificationApi.markAllUnreadAsRead(organizationId);
          setState(prev => ({
              ...prev,
              recentNotifications: [],
              unreadCount: 0
          }));
          fetchUnreadCountsByOrg();
      } catch (error) {
          error && console.error("Failed to mark all as read", error);
      }
  }, [organizationId, fetchUnreadCountsByOrg]);

  const deleteNotification = useCallback(async (notificationId: string) => {
      try {
          await notificationApi.deleteNotification(notificationId);
          setState(prev => {
              const wasUnread = prev.recentNotifications.find(n => n.id === notificationId && !n.isRead);
              const newRecent = prev.recentNotifications.filter(n => n.id !== notificationId);
              
              if (wasUnread) {
                   return {
                      ...prev,
                      recentNotifications: newRecent,
                      unreadCount: Math.max(0, prev.unreadCount - 1)
                  };
              } else {
                   return {
                      ...prev,
                      recentNotifications: newRecent
                  };
              }
          });
          
          fetchUnreadCount();
          fetchUnreadCountsByOrg();

      } catch (error) {
          console.error("Failed to delete notification", error);
      }
  }, [fetchUnreadCount, fetchUnreadCountsByOrg]);

    const refreshNotifications = useCallback(async () => {
        // Parallel fetch
        Promise.all([fetchUnreadCount(), fetchRecentNotifications(), fetchUnreadCountsByOrg()]);
    }, [fetchUnreadCount, fetchRecentNotifications, fetchUnreadCountsByOrg]);

  const router = useRouter();

  // Initial fetch
  useEffect(() => {
      if (userId && organizationId) {
          fetchRecentNotifications();
      }
      if (userId) {
          fetchUnreadCountsByOrg();
      }
  }, [userId, organizationId, fetchRecentNotifications, fetchUnreadCountsByOrg]);

  // Real-time WebSocket Notification Listener
  useEffect(() => {
    if (!userId) return;

    // Join personal notification room
    socketService.joinRoom("user", userId);

    const handleRealtimeNotification = (payload: any) => {
      const notification = payload?.notification || payload;
      if (!notification) return;

      console.log("[NotificationContext] Received real-time notification:", notification);

      // 1. Cập nhật ngay lập tức unreadCount và recentNotifications vào React State
      setState((prev) => {
        const newUnreadCount = typeof payload?.unreadCount === "number"
          ? payload.unreadCount
          : prev.unreadCount + 1;

        const exists = prev.recentNotifications.some((n) => n.id === notification.id);
        const updatedRecent = exists
          ? prev.recentNotifications
          : [notification, ...prev.recentNotifications].slice(0, 20);

        return {
          ...prev,
          unreadCount: newUnreadCount,
          recentNotifications: updatedRecent,
        };
      });

      // 2. Bật Toast popup nổi bật ở góc màn hình
      const actionUrl = notification.actionUrl;
      toast(notification.title || "Thông báo mới", {
        description: notification.message || "",
        duration: 6000,
        action: actionUrl
          ? {
              label: "Xem ngay",
              onClick: () => {
                const targetUrl = actionUrl.startsWith("http")
                  ? new URL(actionUrl).pathname
                  : actionUrl;
                router.push(targetUrl);
              },
            }
          : undefined,
      });

      // 3. Nếu là thông báo KHẨN CẤP / ƯU TIÊN CAO NHẤT (HIGHEST) -> Bật Popup Modal đập thẳng vào màn hình
      if (isNotificationUrgent(notification)) {
        setUrgentAlert({
          isOpen: true,
          notification,
        });
        playEmergencyChime();
      }

      // 4. Cập nhật số lượng thông báo chưa đọc theo từng tổ chức
      fetchUnreadCountsByOrg();
    };

    socketService.on("notification", handleRealtimeNotification);

    return () => {
      socketService.off("notification", handleRealtimeNotification);
      socketService.leaveRoom("user", userId);
    };
  }, [userId, router, fetchUnreadCountsByOrg]);

  const value = useMemo(() => ({
    ...state,
    fetchUnreadCount,
    fetchUnreadCountsByOrg,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }), [state, fetchUnreadCount, fetchUnreadCountsByOrg, fetchRecentNotifications, markAsRead, markAllAsRead, deleteNotification, refreshNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <UrgentTaskModal
        isOpen={urgentAlert.isOpen}
        notification={urgentAlert.notification}
        onClose={dismissUrgentAlert}
        onMarkAsRead={markAsRead}
      />
    </NotificationContext.Provider>
  );
};

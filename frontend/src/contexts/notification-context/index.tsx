import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { notificationApi } from "@/utils/api/notificationApi";
import { AiCatchupResponse, Notification } from "@/types";
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
  // Modern Smart Features
  isDnd: boolean;
  toggleDnd: () => void;
  starredIds: string[];
  toggleStar: (id: string) => void;
  isStarred: (id: string) => boolean;
  aiCatchup: AiCatchupResponse | null;
  isCatchupLoading: boolean;
  fetchAiCatchup: () => Promise<AiCatchupResponse | null>;
  playNotificationSound: (isUrgent?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

// Modern, pleasant harmonic chime using Web Audio API
function playHarmonicChime(isUrgent = false) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Harmonic triad: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    // Urgent: D5 (587.33Hz), G5 (783.99Hz), C6 (1046.5Hz)
    const notes = isUrgent ? [587.33, 783.99, 1046.5] : [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isUrgent ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      const maxGain = isUrgent ? 0.16 : 0.12;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  } catch (e) {
    // Audio context may be restricted by browser policy before first user interaction
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

  // Do Not Disturb mode
  const [isDnd, setIsDnd] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("taskosaur_dnd_enabled") === "true";
    }
    return false;
  });

  const toggleDnd = useCallback(() => {
    setIsDnd((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("taskosaur_dnd_enabled", String(next));
      }
      if (next) {
        toast.info("Đã bật chế độ Không làm phiền (DND)");
      } else {
        toast.success("Đã tắt chế độ Không làm phiền");
      }
      return next;
    });
  }, []);

  // Starred notifications state
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taskosaur_starred_notifications");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("taskosaur_starred_notifications", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const isStarred = useCallback((id: string) => starredIds.includes(id), [starredIds]);

  // AI Catchup state
  const [aiCatchup, setAiCatchup] = useState<AiCatchupResponse | null>(null);
  const [isCatchupLoading, setIsCatchupLoading] = useState(false);

  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;

  const fetchAiCatchup = useCallback(async () => {
    try {
      setIsCatchupLoading(true);
      const res = await notificationApi.getAiCatchup(organizationId);
      setAiCatchup(res);
      return res;
    } catch (e) {
      console.error("Failed to fetch AI catchup", e);
      return null;
    } finally {
      setIsCatchupLoading(false);
    }
  }, [organizationId]);

  const playNotificationSound = useCallback((isUrgent = false) => {
    if (isDnd) return;
    playHarmonicChime(isUrgent);
  }, [isDnd]);

  const dismissUrgentAlert = useCallback(() => {
    if (urgentAlert.notification?.id && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`seen_urgent_${urgentAlert.notification.id}`, "true");
      } catch (e) {}
    }
    setUrgentAlert({ isOpen: false, notification: null });
  }, [urgentAlert.notification]);

  const { user } = useAuth();
  const userId = user?.id;

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

      // 2. Bật Toast và âm thanh nhẹ nhàng (nếu không bật DND)
      const isUrgent = isNotificationUrgent(notification);
      if (!isDnd) {
        playHarmonicChime(isUrgent);
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
      }

      // 3. Nếu là thông báo KHẨN CẤP / ƯU TIÊN CAO NHẤT (HIGHEST) -> Bật Popup Modal
      if (isUrgent && !isDnd) {
        setUrgentAlert({
          isOpen: true,
          notification,
        });
      }

      // 4. Cập nhật số lượng thông báo chưa đọc theo từng tổ chức
      fetchUnreadCountsByOrg();
    };

    socketService.on("notification", handleRealtimeNotification);

    return () => {
      socketService.off("notification", handleRealtimeNotification);
      socketService.leaveRoom("user", userId);
    };
  }, [userId, router, fetchUnreadCountsByOrg, isDnd]);

  const value = useMemo(() => ({
    ...state,
    fetchUnreadCount,
    fetchUnreadCountsByOrg,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isDnd,
    toggleDnd,
    starredIds,
    toggleStar,
    isStarred,
    aiCatchup,
    isCatchupLoading,
    fetchAiCatchup,
    playNotificationSound,
  }), [
    state,
    fetchUnreadCount,
    fetchUnreadCountsByOrg,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isDnd,
    toggleDnd,
    starredIds,
    toggleStar,
    isStarred,
    aiCatchup,
    isCatchupLoading,
    fetchAiCatchup,
    playNotificationSound,
  ]);

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

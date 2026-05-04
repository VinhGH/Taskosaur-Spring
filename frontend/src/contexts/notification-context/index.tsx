import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { notificationApi } from "@/utils/api/notificationApi";
import { Notification } from "@/types";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    unreadCount: 0,
    unreadCountsByOrg: [],
    recentNotifications: [],
    isLoading: false,
    error: null,
  });

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
      setState(prev => ({ ...prev, unreadCountsByOrg: counts }));
    } catch (error) {
      console.error("Failed to fetch unread counts by org", error);
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

  // Initial fetch
  useEffect(() => {
      if (userId && organizationId) {
          fetchRecentNotifications();
      }
      if (userId) {
          fetchUnreadCountsByOrg();
      }
  }, [userId, organizationId, fetchRecentNotifications, fetchUnreadCountsByOrg]);

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
    </NotificationContext.Provider>
  );
};

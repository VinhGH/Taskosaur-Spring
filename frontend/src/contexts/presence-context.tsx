import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { socketService } from "@/lib/socket";
import { SocketEvents } from "@/types/socket";

interface PresenceContextType {
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string) => boolean;
  refreshOnlineStatus: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  refreshOnlineStatus: async () => {},
});

export const usePresence = () => useContext(PresenceContext);

interface PresenceProviderProps {
  children: React.ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await api.get<{ onlineUserIds: string[]; count: number }>("/presence/online");
      if (response.data && Array.isArray(response.data.onlineUserIds)) {
        setOnlineUserIds(new Set(response.data.onlineUserIds));
      }
    } catch (error) {
      // Silently ignore if unauthenticated or network error
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();

    const handleUserOnline = (data: any) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
      }
    };

    const handleUserOffline = (data: any) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleSocketConnected = () => {
      fetchOnlineUsers();
    };

    socketService.on(SocketEvents.USER_ONLINE, handleUserOnline);
    socketService.on(SocketEvents.USER_OFFLINE, handleUserOffline);
    socketService.on(SocketEvents.CONNECTED, handleSocketConnected);

    return () => {
      socketService.off(SocketEvents.USER_ONLINE, handleUserOnline);
      socketService.off(SocketEvents.USER_OFFLINE, handleUserOffline);
      socketService.off(SocketEvents.CONNECTED, handleSocketConnected);
    };
  }, [fetchOnlineUsers]);

  const isUserOnline = useCallback(
    (userId?: string): boolean => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds]
  );

  return (
    <PresenceContext.Provider
      value={{
        onlineUserIds,
        isUserOnline,
        refreshOnlineStatus: fetchOnlineUsers,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export default PresenceProvider;

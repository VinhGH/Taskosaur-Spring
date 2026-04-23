import { io, Socket } from "socket.io-client";
import { SocketEvents, UserStatusPayload } from "@/types/socket";

/**
 * SocketService provides a singleton interface for WebSocket communication.
 * It manages connection, event subscription, and disconnection.
 */
class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private lastErrorLogTime = 0;
  private readonly ERROR_LOG_INTERVAL = 60000; // Log once per minute

  /**
   * Initializes and connects to the WebSocket server.
   * @param token Authentication token
   * @param eventsNamespace Socket namespace (default: "/events")
   */
  connect(token: string, eventsNamespace = "/events") {
    if (this.socket?.connected) {
      console.log("[SocketService] Socket already connected");
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
    const socketUrl = apiBaseUrl.replace("/api", "");

    console.log("[SocketService] Connecting to:", `${socketUrl}${eventsNamespace}`);

    this.socket = io(`${socketUrl}${eventsNamespace}`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();
  }

  /**
   * Configures core event listeners for the socket.
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketService] Socket connected:", this.socket?.id);
      this.connected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketService] Socket disconnected:", reason);
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
        console.warn(
          "[SocketService] Connection error — backend may be offline. Will retry automatically. Error:",
          error.message
        );
        this.lastErrorLogTime = now;
      }
      this.connected = false;
    });

    // Handle user status events
    this.socket.on(SocketEvents.USER_ONLINE, (data: UserStatusPayload) => {
      console.log("[SocketService] User online event:", data);
      this.dispatchCustomEvent(SocketEvents.USER_ONLINE, data);
    });

    this.socket.on(SocketEvents.USER_OFFLINE, (data: UserStatusPayload) => {
      console.log("[SocketService] User offline event:", data);
      this.dispatchCustomEvent(SocketEvents.USER_OFFLINE, data);
    });

    this.socket.on(SocketEvents.CONNECTED, (data) => {
      console.log("[SocketService] Connected acknowledgement received:", data);
    });

    this.socket.on(SocketEvents.ERROR, (error) => {
      console.error("[SocketService] Socket error:", error);
    });
  }

  /**
   * Dispatches a custom event to the window for cross-component communication.
   */
  private dispatchCustomEvent(event: string, detail: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }
  }

  /**
   * Gracefully disconnects from the WebSocket server.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Returns the underlying socket instance.
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Checks if the socket is currently connected.
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Joins a specific room by emitting the appropriate join event.
   * @param room The room type (e.g., 'project', 'workspace', 'organization', 'task')
   * @param id The unique identifier for the room
   */
  joinRoom(room: "project" | "workspace" | "organization" | "task", id: string) {
    if (this.socket) {
      const event = `join:${room}`;
      this.socket.emit(event, { [`${room}Id`]: id });
    }
  }

  /**
   * Leaves a specific room by emitting the appropriate leave event.
   * @param room The room type
   * @param id The unique identifier (optional for some room types)
   */
  leaveRoom(room: "project" | "workspace" | "organization" | "task", id?: string) {
    if (this.socket) {
      const event = `leave:${room}`;
      this.socket.emit(event, id ? { [`${room}Id`]: id } : {});
    }
  }

  /**
   * Subscribes to a socket event.
   */
  on(event: string | SocketEvents, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Unsubscribes from a socket event.
   */
  off(event: string | SocketEvents, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emits an event to the server.
   */
  emit(event: string | SocketEvents, ...args: any[]) {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

/**
 * Convenience helper to initialize the socket connection.
 */
export const initializeSocket = (token: string) => {
  socketService.connect(token);
};

/**
 * Convenience helper to disconnect the socket.
 */
export const disconnectSocket = () => {
  socketService.disconnect();
};

/**
 * Convenience helper to get the socket instance.
 */
export const getSocket = () => socketService.getSocket();

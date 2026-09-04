import { Client, StompSubscription } from "@stomp/stompjs";
import { SocketEvents, UserStatusPayload } from "@/types/socket";

/**
 * SocketService provides a unified interface for real-time WebSocket communication
 * backed by Spring Boot STOMP Message Broker.
 * It manages connection, event subscription, room joining, and auto-reconnection.
 */
class SocketService {
  private client: Client | null = null;
  private connected = false;
  private token: string | null = null;
  private lastErrorLogTime = 0;
  private readonly ERROR_LOG_INTERVAL = 60000;

  // Track room subscriptions: roomKey -> StompSubscription
  private roomSubscriptions: Map<string, StompSubscription> = new Map();
  // Track active rooms for auto-resubscription on reconnect: roomKey -> { room, id }
  private activeRooms: Map<string, { room: string; id: string }> = new Map();
  // Event listeners: eventName -> Set<callback>
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  /**
   * Initializes and connects to the Spring Boot STOMP WebSocket server.
   * @param token Authentication token
   */
  connect(token: string) {
    if (typeof window === "undefined") return;

    if (this.client?.active && this.connected) {
      return;
    }

    this.token = token;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
    const httpUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    const wsUrl = httpUrl.replace(/^http/, "ws") + "/ws";

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg: string) => {
        if (process.env.NODE_ENV === "development") {
          // Keep debug logging clean
        }
      },
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log("[SocketService] Connected to Spring Boot WebSocket STOMP Broker");

      // Auto-resubscribe to active rooms
      this.resubscribeActiveRooms();

      this.dispatchCustomEvent(SocketEvents.CONNECTED, {
        timestamp: new Date().toISOString(),
      });
    };

    this.client.onDisconnect = () => {
      this.connected = false;
      console.log("[SocketService] Disconnected from WebSocket Broker");
    };

    this.client.onStompError = (frame) => {
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
        console.warn("[SocketService] STOMP Broker error:", frame.headers["message"]);
        this.lastErrorLogTime = now;
      }
      this.connected = false;
    };

    this.client.onWebSocketError = (event) => {
      const now = Date.now();
      if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
        console.warn("[SocketService] WebSocket connection error — backend may be starting. Retrying...");
        this.lastErrorLogTime = now;
      }
      this.connected = false;
    };

    this.client.activate();
  }

  /**
   * Resubscribes to all active rooms after a reconnection.
   */
  private resubscribeActiveRooms() {
    this.roomSubscriptions.clear();
    this.activeRooms.forEach(({ room, id }) => {
      this.subscribeToTopic(room, id);
    });
  }

  /**
   * Joins a specific room (project, workspace, task, organization)
   * Maps to Spring STOMP topic: /topic/{room}/{id}
   */
  joinRoom(room: "project" | "workspace" | "organization" | "task" | "user", id: string) {
    if (!id) return;
    const roomKey = `${room}:${id}`;
    this.activeRooms.set(roomKey, { room, id });

    if (this.connected && this.client?.active) {
      this.subscribeToTopic(room, id);
    }
  }

  /**
   * Subscribes to a Spring STOMP destination topic.
   */
  private subscribeToTopic(room: string, id: string) {
    if (!this.client?.active) return;
    const roomKey = `${room}:${id}`;
    if (this.roomSubscriptions.has(roomKey)) return;

    const topicDestination = `/topic/${room}/${id}`;

    try {
      const subscription = this.client.subscribe(topicDestination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const eventName = payload.event;
          const eventData = payload.data !== undefined ? payload.data : payload;

          if (eventName) {
            this.triggerListeners(eventName, eventData);
            this.dispatchCustomEvent(eventName, eventData);
          }
        } catch (e) {
          console.error("[SocketService] Failed to parse message body:", e);
        }
      });

      this.roomSubscriptions.set(roomKey, subscription);
      console.log(`[SocketService] Subscribed to topic ${topicDestination}`);
    } catch (err) {
      console.error(`[SocketService] Error subscribing to ${topicDestination}:`, err);
    }
  }

  /**
   * Leaves a room and unsubscribes from the STOMP topic.
   */
  leaveRoom(room: "project" | "workspace" | "organization" | "task" | "user", id?: string) {
    if (!id) {
      // If id not specified, remove all rooms of this type
      const keysToRemove: string[] = [];
      this.activeRooms.forEach((val, key) => {
        if (val.room === room) keysToRemove.push(key);
      });
      keysToRemove.forEach((key) => {
        this.roomSubscriptions.get(key)?.unsubscribe();
        this.roomSubscriptions.delete(key);
        this.activeRooms.delete(key);
      });
      return;
    }

    const roomKey = `${room}:${id}`;
    this.roomSubscriptions.get(roomKey)?.unsubscribe();
    this.roomSubscriptions.delete(roomKey);
    this.activeRooms.delete(roomKey);
  }

  /**
   * Subscribes to an event callback.
   */
  on(event: string | SocketEvents, callback: (...args: any[]) => void) {
    const eventName = typeof event === "string" ? event : String(event);
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  /**
   * Unsubscribes an event callback.
   */
  off(event: string | SocketEvents, callback?: (...args: any[]) => void) {
    const eventName = typeof event === "string" ? event : String(event);
    if (!callback) {
      this.listeners.delete(eventName);
      return;
    }
    this.listeners.get(eventName)?.delete(callback);
  }

  /**
   * Triggers registered listeners for an event.
   */
  private triggerListeners(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[SocketService] Error in listener for ${event}:`, err);
        }
      });
    }
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
   * Publishes an event to the server STOMP application prefix /app/{event}.
   */
  emit(event: string | SocketEvents, ...args: any[]) {
    if (!this.client?.active || !this.connected) return;
    const destination = `/app/${event}`;
    try {
      this.client.publish({
        destination,
        body: JSON.stringify(args[0] || {}),
      });
    } catch (err) {
      console.error(`[SocketService] Failed to publish to ${destination}:`, err);
    }
  }

  /**
   * Gracefully disconnects from the WebSocket STOMP broker.
   */
  disconnect() {
    this.roomSubscriptions.forEach((sub) => sub.unsubscribe());
    this.roomSubscriptions.clear();
    this.activeRooms.clear();
    this.listeners.clear();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Checks if WebSocket is connected.
   */
  isConnected(): boolean {
    return this.connected && this.client?.active === true;
  }

  /**
   * Returns compatibility socket proxy.
   */
  getSocket(): any {
    return {
      connected: this.connected,
      on: this.on.bind(this),
      off: this.off.bind(this),
      emit: this.emit.bind(this),
    };
  }
}

export const socketService = new SocketService();

export const initializeSocket = (token: string) => {
  socketService.connect(token);
};

export const disconnectSocket = () => {
  socketService.disconnect();
};

export const getSocket = () => socketService.getSocket();

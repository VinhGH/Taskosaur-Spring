export enum SocketEvents {
  // Subscription Events (to server)
  JOIN_ORGANIZATION = "join:organization",
  JOIN_WORKSPACE = "join:workspace",
  JOIN_PROJECT = "join:project",
  JOIN_TASK = "join:task",
  LEAVE_ORGANIZATION = "leave:organization",
  LEAVE_WORKSPACE = "leave:workspace",
  LEAVE_PROJECT = "leave:project",
  LEAVE_TASK = "leave:task",

  // Received Events (from server)
  CONNECTED = "connected",
  JOINED_ORGANIZATION = "joined:organization",
  JOINED_WORKSPACE = "joined:workspace",
  JOINED_PROJECT = "joined:project",
  JOINED_TASK = "joined:task",
  LEFT_ORGANIZATION = "left:organization",
  LEFT_WORKSPACE = "left:workspace",
  LEFT_PROJECT = "left:project",
  LEFT_TASK = "left:task",
  USER_ONLINE = "user:online",
  USER_OFFLINE = "user:offline",
  TASK_CREATED = "task:created",
  TASK_UPDATED = "task:updated",
  TASK_DELETED = "task:deleted",
  TASK_STATUS_CHANGED = "task:status_changed",
  TASK_ASSIGNED = "task:assigned",
  COMMENT_ADDED = "comment:added",
  TIME_STARTED = "time:started",
  TIME_STOPPED = "time:stopped",
  PROJECT_UPDATED = "project:updated",
  SPRINT_STARTED = "sprint:started",
  SPRINT_COMPLETED = "sprint:completed",
  NOTIFICATION = "notification",
  USER_TYPING = "user:typing",
  USER_STOPPED_TYPING = "user:stopped_typing",
  ERROR = "error",
}

export interface SocketEventPayload<T = any> {
  event: string;
  data: T;
  timestamp: string;
}

export interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  timestamp?: string;
  lastSeen?: string;
}

export interface TaskEventPayload {
  taskId: string;
  updates?: any;
  task?: any;
  statusChange?: any;
  assignment?: any;
  comment?: any;
}

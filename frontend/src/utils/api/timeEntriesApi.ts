import api from "@/lib/api";
import { TimeEntry } from "@/types/tasks";

export interface CreateTimeEntryPayload {
  taskId: string;
  description?: string;
  timeSpent?: number;
  startTime?: string;
  endTime?: string;
  date?: string;
}

export interface UpdateTimeEntryPayload {
  description?: string;
  timeSpent?: number;
  startTime?: string;
  endTime?: string;
  date?: string;
}

export interface TimeSpentSummary {
  totalTimeSpent: number;
  totalTimeSpentHours: number;
  totalEntries: number;
  taskSummary: Array<{
    taskId: string;
    taskTitle: string;
    taskSlug: string;
    totalMinutes: number;
    totalHours: number;
    entryCount: number;
  }>;
  userSummary: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    totalMinutes: number;
    totalHours: number;
    entryCount: number;
  }>;
  entries: TimeEntry[];
}

export const timeEntriesApi = {
  getTaskTimeEntries: async (taskId: string): Promise<TimeEntry[]> => {
    const response = await api.get<TimeEntry[]>(`/time-entries?taskId=${encodeURIComponent(taskId)}`);
    return response.data;
  },

  getAllTimeEntries: async (params?: {
    taskId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntry[]> => {
    const query = new URLSearchParams();
    if (params?.taskId) query.append("taskId", params.taskId);
    if (params?.userId) query.append("userId", params.userId);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const response = await api.get<TimeEntry[]>(`/time-entries?${query.toString()}`);
    return response.data;
  },

  getActiveTimer: async (): Promise<TimeEntry | null> => {
    try {
      const response = await api.get<TimeEntry>("/time-entries/active");
      return response.data || null;
    } catch {
      return null;
    }
  },

  startTimer: async (taskId: string, description?: string): Promise<{ message: string; activeTimer: TimeEntry }> => {
    const response = await api.post<{ message: string; activeTimer: TimeEntry }>("/time-entries/start", {
      taskId,
      description,
    });
    return response.data;
  },

  stopTimer: async (taskId?: string, description?: string): Promise<{ message: string; timeEntry: TimeEntry }> => {
    const response = await api.post<{ message: string; timeEntry: TimeEntry }>("/time-entries/stop", {
      taskId,
      description,
    });
    return response.data;
  },

  createTimeEntry: async (payload: CreateTimeEntryPayload): Promise<TimeEntry> => {
    const response = await api.post<TimeEntry>("/time-entries", payload);
    return response.data;
  },

  updateTimeEntry: async (id: string, payload: UpdateTimeEntryPayload): Promise<TimeEntry> => {
    const response = await api.put<TimeEntry>(`/time-entries/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  deleteTimeEntry: async (id: string): Promise<void> => {
    await api.delete(`/time-entries/${encodeURIComponent(id)}`);
  },

  getTimeSummary: async (params?: {
    taskId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeSpentSummary> => {
    const query = new URLSearchParams();
    if (params?.taskId) query.append("taskId", params.taskId);
    if (params?.userId) query.append("userId", params.userId);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const response = await api.get<TimeSpentSummary>(`/time-entries/summary?${query.toString()}`);
    return response.data;
  },
};

import React, { useState, useEffect, useCallback } from "react";
import { Task, TimeEntry } from "@/types/tasks";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { Button } from "@/components/ui";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { formatDateForDisplay } from "@/utils/date";
import { timeEntriesApi } from "@/utils/api/timeEntriesApi";
import { toast } from "sonner";
import { HiPlay, HiStop, HiArrowDownTray, HiPlus, HiPencil, HiTrash } from "react-icons/hi2";

interface TimeTrackingProps {
  task: Task;
  onLogTime?: (timeEntry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateTime?: (timeEntryId: string, timeEntry: Partial<TimeEntry>) => void;
  onDeleteTime?: (timeEntryId: string) => void;
}

export default function TimeTracking({
  task,
  onLogTime,
  onUpdateTime,
  onDeleteTime,
}: TimeTrackingProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(task.timeEntries || []);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showLogTime, setShowLogTime] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timeEntryToDelete, setTimeEntryToDelete] = useState<TimeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [timeLogData, setTimeLogData] = useState({
    timeSpent: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [editData, setEditData] = useState({
    timeSpent: 0,
    description: "",
    date: "",
  });

  // Fetch entries from backend API
  const fetchEntries = useCallback(async () => {
    if (!task?.id) return;
    try {
      setLoadingEntries(true);
      const data = await timeEntriesApi.getTaskTimeEntries(task.id);
      if (Array.isArray(data)) {
        setEntries(data);
      }
    } catch (error) {
      console.warn("Could not load time entries from API, using task props", error);
      if (task.timeEntries) {
        setEntries(task.timeEntries);
      }
    } finally {
      setLoadingEntries(false);
    }
  }, [task?.id, task?.timeEntries]);

  // Check active timer on mount
  useEffect(() => {
    fetchEntries();

    const checkActiveTimer = async () => {
      try {
        const active = await timeEntriesApi.getActiveTimer();
        if (active && active.taskId === task.id && active.startTime) {
          setIsTimerRunning(true);
          const start = new Date(active.startTime);
          setTimerStart(start);
          const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
          setTimerElapsed(Math.max(0, elapsed));
        }
      } catch (e) {
        // Silently ignore
      }
    };

    checkActiveTimer();
  }, [fetchEntries, task.id]);

  // Timer interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart.getTime()) / 1000);
        setTimerElapsed(Math.max(0, elapsed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStart]);

  // Start timer
  const handleStartTimer = async () => {
    try {
      setIsActionLoading(true);
      await timeEntriesApi.startTimer(task.id);
      setIsTimerRunning(true);
      setTimerStart(new Date());
      setTimerElapsed(0);
      toast.success("Đã bắt đầu bấm giờ làm việc");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Không thể bắt đầu bấm giờ";
      toast.error(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Stop timer
  const handleStopTimer = async () => {
    try {
      setIsActionLoading(true);
      const res = await timeEntriesApi.stopTimer(task.id, timeLogData.description);
      setIsTimerRunning(false);
      setTimerStart(null);
      setTimerElapsed(0);
      await fetchEntries();
      const minutes = res?.timeEntry?.timeSpent || Math.floor(timerElapsed / 60);
      toast.success(`Đã dừng bấm giờ và ghi nhận ${minutes} phút`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Không thể dừng bấm giờ";
      toast.error(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerStart(null);
    setTimerElapsed(0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalTimeSpent = () => {
    return entries.reduce((total, entry) => total + (entry.timeSpent || 0), 0);
  };

  const getTimeRemaining = () => {
    const totalSpent = getTotalTimeSpent();
    const estimated = task.originalEstimate || 0;
    return Math.max(0, estimated - totalSpent);
  };

  const getProgressPercentage = () => {
    const totalSpent = getTotalTimeSpent();
    const estimated = task.originalEstimate || 0;
    if (estimated === 0) return 0;
    return Math.min(100, (totalSpent / estimated) * 100);
  };

  // Manual log time
  const handleLogTime = async () => {
    if (timeLogData.timeSpent <= 0) return;

    try {
      setIsActionLoading(true);
      await timeEntriesApi.createTimeEntry({
        taskId: task.id,
        timeSpent: timeLogData.timeSpent,
        description: timeLogData.description,
        date: new Date(timeLogData.date).toISOString(),
      });
      await fetchEntries();
      if (onLogTime) {
        onLogTime({
          description: timeLogData.description,
          timeSpent: timeLogData.timeSpent,
          date: timeLogData.date,
          taskId: task.id,
          userId: "",
        });
      }
      setTimeLogData({
        timeSpent: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowLogTime(false);
      toast.success("Đã ghi nhận thời gian làm việc");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi khi lưu thời gian");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Edit time entry
  const handleOpenEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditData({
      timeSpent: entry.timeSpent,
      description: entry.description || "",
      date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : "",
    });
  };

  const handleUpdateTime = async () => {
    if (!editingEntry) return;

    try {
      setIsActionLoading(true);
      await timeEntriesApi.updateTimeEntry(editingEntry.id, {
        timeSpent: editData.timeSpent,
        description: editData.description,
        date: editData.date ? new Date(editData.date).toISOString() : undefined,
      });
      await fetchEntries();
      if (onUpdateTime) {
        onUpdateTime(editingEntry.id, editData);
      }
      setEditingEntry(null);
      toast.success("Đã cập nhật bản ghi thời gian");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete time entry
  const handleDeleteTime = async (entry: TimeEntry) => {
    try {
      setIsActionLoading(true);
      await timeEntriesApi.deleteTimeEntry(entry.id);
      await fetchEntries();
      if (onDeleteTime) {
        onDeleteTime(entry.id);
      }
      setTimeEntryToDelete(null);
      toast.success("Đã xóa bản ghi thời gian");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi khi xóa bản ghi");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export worklog to CSV
  const handleExportCsv = () => {
    if (entries.length === 0) {
      toast.info("Chưa có dữ liệu làm việc để xuất");
      return;
    }

    const headers = ["Task", "Thành viên", "Email", "Ngày", "Số phút", "Số giờ", "Mô tả công việc"];
    const rows = entries.map((entry) => {
      const userName = entry.user ? `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.trim() : "Unknown";
      const userEmail = entry.user?.email || "";
      const dateStr = entry.date ? formatDateForDisplay(entry.date) : "";
      const minutes = entry.timeSpent || 0;
      const hours = (minutes / 60).toFixed(2);
      const desc = (entry.description || "").replace(/"/g, '""');
      return [
        `"${task.title || task.slug || ""}"`,
        `"${userName}"`,
        `"${userEmail}"`,
        `"${dateStr}"`,
        minutes,
        hours,
        `"${desc}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `worklog-${task.slug || task.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất bảng thống kê giờ làm (CSV)");
  };

  return (
    <div className="space-y-6">
      {/* Time Summary Card */}
      <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tổng quan Thời gian Làm việc</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="flex items-center gap-1 text-xs"
          >
            <HiArrowDownTray className="w-4 h-4" />
            <span>Xuất Worklog (CSV)</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatTime(getTotalTimeSpent())}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Đã làm việc</div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatTime(task.originalEstimate || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Ước tính ban đầu</div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatTime(getTimeRemaining())}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Thời gian còn lại</div>
          </div>
        </div>

        {/* Progress Bar */}
        {task.originalEstimate && task.originalEstimate > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Tiến độ hoàn thành</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getProgressPercentage() > 100 ? "bg-rose-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, getProgressPercentage())}%` }}
              />
            </div>
          </div>
        )}

        {/* Timer Box */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-mono font-semibold text-gray-900 dark:text-white px-3 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                {formatDuration(timerElapsed)}
              </div>
              <div className="flex space-x-2">
                {!isTimerRunning ? (
                  <Button
                    onClick={handleStartTimer}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <HiPlay className="w-4 h-4" />
                    <span>Bắt đầu tính giờ</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTimer}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <HiStop className="w-4 h-4" />
                    <span>Dừng & Lưu</span>
                  </Button>
                )}
                <Button onClick={handleResetTimer} variant="outline" size="sm">
                  Đặt lại
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setShowLogTime(true)}
              variant="outline"
              className="flex items-center gap-1.5 text-sm"
            >
              <HiPlus className="w-4 h-4" />
              <span>Ghi nhận thủ công</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nhật ký Thời gian (Worklog)</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {entries.length} bản ghi
          </span>
        </div>

        {loadingEntries ? (
          <div className="text-center py-6 text-sm text-gray-500">Đang tải nhật ký...</div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition"
              >
                <div className="flex items-center space-x-3">
                  <UserAvatar user={entry.user || "User"} size="sm" showPresence={true} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatTime(entry.timeSpent || 0)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        vào ngày {formatDateForDisplay(entry.date)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(entry)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Chỉnh sửa"
                  >
                    <HiPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTimeEntryToDelete(entry)}
                    className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Xóa bản ghi"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="font-medium">Chưa có bản ghi thời gian nào</p>
            <p className="text-xs mt-1">Bấm nút tính giờ hoặc nhập thủ công để bắt đầu theo dõi</p>
          </div>
        )}
      </div>

      {/* Manual Log Modal */}
      {showLogTime && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ghi nhận Giờ làm việc</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian làm việc (phút) *
                </label>
                <input
                  type="number"
                  value={timeLogData.timeSpent}
                  onChange={(e) =>
                    setTimeLogData((prev) => ({
                      ...prev,
                      timeSpent: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  step="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả công việc
                </label>
                <textarea
                  value={timeLogData.description}
                  onChange={(e) =>
                    setTimeLogData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bạn đã hoàn thành những gì?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  value={timeLogData.date}
                  onChange={(e) => setTimeLogData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowLogTime(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleLogTime}
                disabled={timeLogData.timeSpent <= 0 || isActionLoading}
              >
                Lưu thời gian
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chỉnh sửa Bản ghi Thời gian
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian (phút) *
                </label>
                <input
                  type="number"
                  value={editData.timeSpent}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, timeSpent: Math.max(0, parseInt(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả công việc
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setEditingEntry(null)}>
                Hủy
              </Button>
              <Button
                onClick={handleUpdateTime}
                disabled={editData.timeSpent <= 0 || isActionLoading}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {timeEntryToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setTimeEntryToDelete(null)}
          onConfirm={() => handleDeleteTime(timeEntryToDelete)}
          title="Xóa Bản ghi Thời gian"
          message={`Bạn có chắc chắn muốn xóa bản ghi thời gian ${formatTime(timeEntryToDelete.timeSpent)} này không?`}
          confirmText="Xóa"
          cancelText="Hủy"
          type="danger"
        />
      )}
    </div>
  );
}

import ActionButton from "@/components/common/ActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/contexts/project-context";
import { GithubRepo, GithubSyncStatus, useGithubSync } from "@/hooks/useGithubSync";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plug,
  RefreshCw,
  Settings,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";
import ConfirmationModal from "../modals/ConfirmationModal";

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
interface GithubSyncPanelProps {
  projectId: string;
  projectStatuses?: TaskStatus[];
}

type Step = "status" | "credentials" | "repository" | "mapping" | "done";

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────
function formatRelative(date: string | Date | null) {
  if (!date) return "Never";
  const now = Date.now();
  const target = new Date(date).getTime();
  const isFuture = target > now;
  const diff = Math.abs(now - target);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return isFuture ? "Soon" : "Just now";

  const value = minutes < 60
    ? `${minutes}m`
    : Math.floor(minutes / 60) < 24
      ? `${Math.floor(minutes / 60)}h`
      : `${Math.floor(minutes / 1440)}d`;

  return isFuture ? `In ${value}` : `${value} ago`;
}

// ─────────────────────────────────────────────────────────────────
//  Step indicator
// ─────────────────────────────────────────────────────────────────
function GithubStepper({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-[var(--border)] z-0">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-500 ease-in-out"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((label, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div
              key={label}
              className="flex flex-col items-center relative z-10"
              style={{ flex: 1 }}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 border-2",
                  isCompleted
                    ? "bg-[var(--primary)] text-[var(--background)] border-[var(--primary)] shadow-md"
                    : isCurrent
                      ? "bg-[var(--primary)] text-[var(--background)] border-[var(--primary)] shadow-lg scale-110"
                      : "bg-[var(--muted)] text-[var(--primary)] border-[var(--border)]"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium mt-1.5 transition-colors duration-300 text-center px-1",
                  isCurrent
                    ? "text-[var(--foreground)]"
                    : isCompleted
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted-foreground)]"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main Panel
// ─────────────────────────────────────────────────────────────────
export default function GithubSyncPanel({ projectId, projectStatuses = [] }: GithubSyncPanelProps) {
  const {
    getStatus,
    validateAndListRepos,
    connect,
    syncNow,
    updateSync,
    disconnect,
    loading: githubLoading,
    error: githubError,
  } = useGithubSync();
  const { t } = useTranslation(["integrations", "common"]);
  const { getTaskStatusByProject } = useProject();

  const [internalStatuses, setInternalStatuses] = useState<TaskStatus[]>([]);
  const [syncStatus, setSyncStatus] = useState<GithubSyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Setup wizard state
  const [step, setStep] = useState<Step>("status");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState("");
  const [statusMappings, setStatusMappings] = useState<Record<string, string>>({
    open: "",
    closed: "",
  });
  const [syncInterval, setSyncInterval] = useState(15);
  const [syncDirection, setSyncDirection] = useState("ONE_WAY_IMPORT");

  // Connected panel state
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingMappings, setEditingMappings] = useState<Record<string, string>>({});
  const [editingInterval, setEditingInterval] = useState(15);
  const [savingConfig, setSavingConfig] = useState(false);

  // Refresh status
  const refreshStatus = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingStatus(true);
    else setRefreshing(true);

    try {
      const s = await getStatus(projectId);
      setSyncStatus(s);
      setStep("status");
    } catch (err) {
      console.error("Failed to refresh GitHub sync status:", err);
    } finally {
      setLoadingStatus(false);
      setRefreshing(false);
    }
  }, [projectId, getStatus]);

  useEffect(() => {
    refreshStatus(true);
  }, [refreshStatus]);

  // Fetch project statuses if not passed
  useEffect(() => {
    if (projectStatuses.length === 0 && projectId) {
      getTaskStatusByProject(projectId)
        .then((data) => {
          setInternalStatuses(data || []);
        })
        .catch((err) => {
          console.error("Failed to fetch project statuses:", err);
        });
    }
  }, [projectId, projectStatuses.length, getTaskStatusByProject]);

  const activeStatuses = projectStatuses.length > 0 ? projectStatuses : internalStatuses;

  // Wizard: Step 1 Validate token & fetch repos
  const handleValidateToken = async () => {
    if (!token.trim()) {
      toast.error("Vui lòng nhập GitHub Personal Access Token");
      return;
    }
    try {
      const data = await validateAndListRepos(token.trim());
      setRepos(data);
      if (data.length === 0) {
        toast.warning("Không tìm thấy repository nào mà token này có quyền truy cập");
      } else {
        toast.success(`Đã tìm thấy ${data.length} repositories`);
      }
      setStep("repository");
    } catch (err: any) {
      toast.error(err.message || "Xác thực GitHub token thất bại");
    }
  };

  // Wizard: Step 2 Select repository
  const handleSelectRepository = () => {
    if (!selectedRepoFullName) {
      toast.error("Vui lòng chọn 1 repository");
      return;
    }

    // Pre-populate sensible defaults if available
    const openStatus = activeStatuses.find((s) => s.category?.toLowerCase() === "to_do" || s.name.toLowerCase().includes("to do") || s.name.toLowerCase().includes("todo")) || activeStatuses[0];
    const closedStatus = activeStatuses.find((s) => s.category?.toLowerCase() === "done" || s.name.toLowerCase().includes("done") || s.name.toLowerCase().includes("hoàn thành")) || activeStatuses[activeStatuses.length - 1];

    setStatusMappings({
      open: openStatus?.id || "",
      closed: closedStatus?.id || "",
    });

    setStep("mapping");
  };

  // Wizard: Step 3 Save & Connect
  const handleConnect = async () => {
    const selectedRepo = repos.find((r) => r.fullName === selectedRepoFullName);
    if (!selectedRepo) {
      toast.error("Không tìm thấy thông tin repository đã chọn");
      return;
    }

    try {
      const res = await connect({
        projectId,
        repoOwner: selectedRepo.owner,
        repoName: selectedRepo.name,
        repoId: String(selectedRepo.id),
        token: token.trim(),
        syncInterval,
        syncDirection,
        statusMappings,
      });

      setSyncStatus(res);
      setStep("status");
      toast.success("Kết nối và đồng bộ GitHub thành công!");
    } catch (err: any) {
      toast.error(err.message || "Kết nối GitHub thất bại");
    }
  };

  // Manual trigger sync
  const handleSyncNow = async () => {
    if (!projectId) return;
    setSyncing(true);
    try {
      const res = await syncNow(projectId);
      setSyncStatus(res);
      toast.success("Đồng bộ GitHub hoàn tất!");
    } catch (err: any) {
      toast.error(err.message || "Đồng bộ thất bại");
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!projectId) return;
    setDisconnecting(true);
    try {
      await disconnect(projectId);
      setSyncStatus(null);
      setStep("status");
      setIsDisconnectModalOpen(false);
      toast.success("Đã ngắt kết nối GitHub");
    } catch (err: any) {
      toast.error(err.message || "Không thể ngắt kết nối");
    } finally {
      setDisconnecting(false);
    }
  };

  // Save edits
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await updateSync(projectId, {
        syncInterval: editingInterval,
        statusMappings: editingMappings,
      });
      setSyncStatus(res);
      setIsEditing(false);
      toast.success("Cập nhật cấu hình thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại");
    } finally {
      setSavingConfig(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  //  VIEW: Connected Status Dashboard
  // ─────────────────────────────────────────────────────────────────
  if (syncStatus) {
    return (
      <>
        <Card className="border-none bg-[var(--card)]">
          <CardHeader className="border-b border-[var(--border)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FaGithub className="text-[var(--primary)]" size={24} />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-md font-semibold">
                      {syncStatus.githubRepoOwner}/{syncStatus.githubRepoName}
                    </CardTitle>
                    <Badge variant={syncStatus.syncEnabled ? "default" : "secondary"} className="text-[10px]">
                      {syncStatus.syncEnabled ? "Đang hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 mt-0.5">
                    <a
                      href={`https://github.com/${syncStatus.githubRepoOwner}/${syncStatus.githubRepoName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-[var(--primary)] inline-flex items-center gap-0.5"
                    >
                      Xem trên GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                  {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingInterval(syncStatus.syncInterval || 15);
                    setEditingMappings(syncStatus.statusMappings || {});
                    setIsEditing(!isEditing);
                  }}
                  className="h-8 w-8"
                  title="Cài đặt cấu hình"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                  Số Issue đã nhập
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">{syncStatus.issuesImported ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                  Lần đồng bộ gần nhất
                </span>
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  {formatRelative(syncStatus.lastSyncAt || null)}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                  Trạng thái lần cuối
                </span>
                <span className="mt-0.5 block">
                  {syncStatus.lastSyncStatus === "SUCCESS" ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-[10px] h-5">
                      ✓ Đã đồng bộ
                    </Badge>
                  ) : syncStatus.lastSyncStatus === "FAILED" ? (
                    <Badge variant="destructive" className="text-[10px] h-5" title={syncStatus.lastSyncError || ""}>
                      ✗ Thất bại
                    </Badge>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">Chưa đồng bộ</span>
                  )}
                </span>
              </div>
            </div>

            {/* Inline Configuration Editor */}
            {isEditing && (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4 animate-in fade-in duration-200">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Chỉnh sửa cấu hình đồng bộ
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>Open Issue →</span>
                    <Select
                      value={editingMappings.open || ""}
                      onValueChange={(val) => setEditingMappings((prev) => ({ ...prev, open: val }))}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue placeholder="Chọn trạng thái..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span>Closed Issue →</span>
                    <Select
                      value={editingMappings.closed || ""}
                      onValueChange={(val) => setEditingMappings((prev) => ({ ...prev, closed: val }))}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue placeholder="Chọn trạng thái..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>Tần suất đồng bộ</span>
                    <Select
                      value={String(editingInterval)}
                      onValueChange={(val) => setEditingInterval(Number(val))}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Mỗi 5 phút</SelectItem>
                        <SelectItem value="15">Mỗi 15 phút</SelectItem>
                        <SelectItem value="30">Mỗi 30 phút</SelectItem>
                        <SelectItem value="60">Mỗi 60 phút</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig}>
                    {savingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            )}

            {/* Danger Zone: Disconnect */}
            <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
              <span className="text-xs text-[var(--muted-foreground)]">
                Ngắt kết nối sẽ ngừng đồng bộ tự động giữa Taskosaur và GitHub.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDisconnectModalOpen(true)}
                className="text-xs h-8"
              >
                Ngắt kết nối
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfirmationModal
          isOpen={isDisconnectModalOpen}
          onClose={() => setIsDisconnectModalOpen(false)}
          onConfirm={handleDisconnect}
          title="Ngắt kết nối GitHub Sync?"
          message="Hành động này sẽ hủy liên kết giữa dự án và repository GitHub. Các task đã được tạo trước đó trên Taskosaur sẽ không bị xóa."
          confirmText="Ngắt kết nối"
          type="danger"
          isLoading={disconnecting}
        />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  //  VIEW: Overview / Landing Screen (unlinked)
  // ─────────────────────────────────────────────────────────────────
  if (step === "status") {
    return (
      <Card className="border-none bg-[var(--card)]">
        <CardHeader className="border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <FaGithub className="text-[var(--primary)]" size={24} />
            <div>
              <CardTitle className="text-md">{t("github.title", "Đồng bộ GitHub")}</CardTitle>
              <CardDescription>{t("github.subtitle", "Tự động nhập Issue từ GitHub thành công việc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
            {[
              t("github.features.import_issues", "Nhập Issue từ GitHub thành công việc Taskosaur"),
              t("github.features.map_statuses", "Ánh xạ trạng thái Open/Closed của Issue với trạng thái dự án của bạn"),
              t("github.features.auto_sync", "Tự động đồng bộ theo khoảng thời gian (5–60 phút)"),
              t("github.features.closed_issues", "Issue đã đóng trên GitHub sẽ được tự động cập nhật trạng thái tại đây"),
              t("github.features.repo_support", "Hỗ trợ cả repository Công khai (Public) và Riêng tư (Private)"),
            ].map((f) => (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/30"
                key={f}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-500" />
                </div>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center pt-6 border-t border-[var(--border)]">
            <ActionButton
              primary
              size="lg"
              className="px-10"
              leftIcon={<FaGithub size={18} />}
              onClick={() => setStep("credentials")}
            >
              {t("github.connect_btn", "Kết nối GitHub")}
            </ActionButton>
            <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
              {t("github.landing_note", "Bạn cần Personal Access Token (classic) với quyền repo từ GitHub.")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  //  VIEW: Setup Wizard (credentials -> repository -> mapping)
  // ─────────────────────────────────────────────────────────────────
  const stepIdx = step === "credentials" ? 0 : step === "repository" ? 1 : 2;
  const wizardSteps = [
    t("github.wizard.credentials", "Thông tin xác thực"),
    t("github.wizard.repository", "Chọn Repository"),
    t("github.wizard.mapping", "Ánh xạ trạng thái"),
  ];

  return (
    <Card className="border-none bg-[var(--card)]">
      <CardHeader className="border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <FaGithub className="text-[var(--primary)]" size={24} />
          <div>
            <CardTitle className="text-md">{t("github.wizard.connect_title", "Kết nối GitHub")}</CardTitle>
            <CardDescription className="text-xs text-[var(--muted-foreground)]">
              {t("github.wizard.connect_subtitle", "Thiết lập kết nối GitHub và chọn repository cho dự án của bạn")}
            </CardDescription>
          </div>
        </div>

        <GithubStepper currentStep={stepIdx} steps={wizardSteps} />
      </CardHeader>

      <CardContent className="pt-8 pb-8">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* STEP 1: CREDENTIALS */}
          {step === "credentials" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-xs space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-[var(--foreground)]">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  Hướng dẫn tạo GitHub Token
                </div>
                <p className="text-[var(--muted-foreground)]">
                  1. Truy cập{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Taskosaur%20Integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5"
                  >
                    github.com/settings/tokens <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-[var(--muted-foreground)]">
                  2. Tạo một <strong>Personal Access Token (classic)</strong> và tích chọn quyền <code>repo</code> (Full control of private repositories).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gh-token" className="text-xs font-medium">
                  GitHub Personal Access Token <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="gh-token"
                    type={showToken ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Token được lưu trữ an toàn và chỉ dùng để giao tiếp với GitHub API.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep("status")}>
                  Quay lại
                </Button>
                <Button
                  onClick={handleValidateToken}
                  disabled={githubLoading || !token.trim()}
                  className="gap-2"
                >
                  {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tiếp tục: Chọn Repository <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: REPOSITORY */}
          {step === "repository" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Chọn Repository cần liên kết <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedRepoFullName} onValueChange={setSelectedRepoFullName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn một repository từ GitHub..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {repos.map((r) => (
                      <SelectItem key={r.id} value={r.fullName}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">{r.fullName}</span>
                          <div className="flex items-center gap-2">
                            {r.isPrivate ? (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Private</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Public</Badge>
                            )}
                            <span className="text-[11px] text-[var(--muted-foreground)]">
                              {r.openIssuesCount} issues
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep("credentials")}>
                  Quay lại
                </Button>
                <Button
                  onClick={handleSelectRepository}
                  disabled={!selectedRepoFullName}
                  className="gap-2"
                >
                  Tiếp tục: Ánh xạ trạng thái <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: MAPPING */}
          {step === "mapping" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold mb-1">Ánh xạ trạng thái Issue sang Task</h4>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">
                  Chọn cột trạng thái trong Taskosaur tương ứng với trạng thái của GitHub Issue.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        Open Issue
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">→</span>
                    </div>
                    <Select
                      value={statusMappings.open || ""}
                      onValueChange={(val) => setStatusMappings((prev) => ({ ...prev, open: val }))}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Chọn trạng thái..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                        Closed Issue
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">→</span>
                    </div>
                    <Select
                      value={statusMappings.closed || ""}
                      onValueChange={(val) => setStatusMappings((prev) => ({ ...prev, closed: val }))}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Chọn trạng thái..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tần suất đồng bộ tự động</Label>
                  <Select
                    value={String(syncInterval)}
                    onValueChange={(val) => setSyncInterval(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Mỗi 5 phút</SelectItem>
                      <SelectItem value="15">Mỗi 15 phút (Khuyên dùng)</SelectItem>
                      <SelectItem value="30">Mỗi 30 phút</SelectItem>
                      <SelectItem value="60">Mỗi 60 phút</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Hướng đồng bộ</Label>
                  <Select value={syncDirection} onValueChange={setSyncDirection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_WAY_IMPORT">1 chiều: GitHub → Taskosaur</SelectItem>
                      <SelectItem value="TWO_WAY">2 chiều: GitHub ⟷ Taskosaur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--border)]">
                <Button variant="outline" onClick={() => setStep("repository")}>
                  Quay lại
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={githubLoading}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                  Lưu và bắt đầu đồng bộ
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

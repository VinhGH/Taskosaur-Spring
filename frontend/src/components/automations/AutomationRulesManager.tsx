import React, { useState, useEffect } from "react";
import {
  automationRulesApi,
  AutomationRule,
  RuleExecution,
  TriggerType,
  ActionType,
} from "@/utils/api/automationRulesApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleSwitch } from "@/components/common/ToggleButton";
import ActionButton from "@/components/common/ActionButton";
import {
  HiBolt,
  HiPlus,
  HiTrash,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiSparkles,
  HiArrowRight,
  HiShieldExclamation,
  HiUserGroup,
} from "react-icons/hi2";
import { toast } from "sonner";
import { formatDateTimeForDisplay } from "@/utils/date";

interface AutomationRulesManagerProps {
  projectId: string;
  workspaceId?: string;
  projectMembers?: any[];
  statuses?: any[];
}

export default function AutomationRulesManager({
  projectId,
  workspaceId,
  projectMembers = [],
  statuses = [],
}: AutomationRulesManagerProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [executions, setExecutions] = useState<RuleExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("TASK_STATUS_CHANGED");
  const [triggerStatusId, setTriggerStatusId] = useState("");
  const [triggerPriority, setTriggerPriority] = useState("HIGHEST");
  const [actionType, setActionType] = useState<ActionType>("ASSIGN_TASK");
  const [actionAssigneeId, setActionAssigneeId] = useState("");
  const [actionStatusId, setActionStatusId] = useState("");
  const [actionPriority, setActionPriority] = useState("HIGHEST");
  const [actionAlertTitle, setActionAlertTitle] = useState("");
  const [actionAlertMessage, setActionAlertMessage] = useState("");
  const [actionComment, setActionComment] = useState("");

  useEffect(() => {
    if (projectId) {
      loadRules();
    }
  }, [projectId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await automationRulesApi.getRulesByProject(projectId);
      setRules(data);
    } catch (error) {
      toast.error("Failed to load automation rules");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (ruleId: string) => {
    try {
      const updated = await automationRulesApi.toggleRule(ruleId);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
      toast.success(
        updated.status === "ACTIVE"
          ? "Automation rule activated"
          : "Automation rule deactivated"
      );
    } catch (error) {
      toast.error("Failed to update rule status");
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      await automationRulesApi.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Automation rule deleted");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleOpenHistory = async (rule: AutomationRule) => {
    setSelectedRule(rule);
    setIsHistoryOpen(true);
    setLoadingExecutions(true);
    try {
      const data = await automationRulesApi.getRuleExecutions(rule.id);
      setExecutions(data);
    } catch (error) {
      toast.error("Failed to load execution logs");
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedRule(null);
    setName("");
    setDescription("");
    setTriggerType("TASK_STATUS_CHANGED");
    setTriggerStatusId(statuses[0]?.id || "");
    setTriggerPriority("HIGHEST");
    setActionType("ASSIGN_TASK");
    setActionAssigneeId(projectMembers[0]?.user?.id || projectMembers[0]?.id || "");
    setActionStatusId(statuses[1]?.id || statuses[0]?.id || "");
    setActionPriority("HIGHEST");
    setActionAlertTitle("Urgent Task Alert");
    setActionAlertMessage("Task priority set to HIGHEST - needs immediate attention!");
    setActionComment("Automated: Task moved to Done. QA verification required.");
    setIsModalOpen(true);
  };

  const handleUseTemplate = (templateType: "qa_done" | "urgent_highest" | "auto_in_progress") => {
    if (templateType === "qa_done") {
      const doneStatus = statuses.find((s) => s.name?.toLowerCase().includes("done")) || statuses[statuses.length - 1];
      const member = projectMembers[0];
      const memberId = member?.user?.id || member?.id || "";

      setName("Auto-Assign QA When Done");
      setDescription("Automatically assign tester and add completion note when task moves to Done");
      setTriggerType("TASK_STATUS_CHANGED");
      setTriggerStatusId(doneStatus?.id || "");
      setActionType("ASSIGN_TASK");
      setActionAssigneeId(memberId);
    } else if (templateType === "urgent_highest") {
      setName("Urgent Alert on Highest Priority");
      setDescription("Broadcast high-priority alert notification when task priority is marked Highest");
      setTriggerType("TASK_UPDATED");
      setTriggerPriority("HIGHEST");
      setActionType("SEND_NOTIFICATION");
      setActionAlertTitle("🚨 Urgent Task Alert");
      setActionAlertMessage("Task priority escalated to HIGHEST. Immediate review required!");
    } else if (templateType === "auto_in_progress") {
      const inProgStatus = statuses.find((s) => s.name?.toLowerCase().includes("progress")) || statuses[0];
      setName("Auto In-Progress on Assign");
      setDescription("Automatically advance task to In-Progress status once assigned");
      setTriggerType("TASK_ASSIGNED");
      setActionType("CHANGE_STATUS");
      setActionStatusId(inProgStatus?.id || "");
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!name.trim()) {
      toast.error("Please provide a name for this automation rule");
      return;
    }

    setSubmitting(true);
    try {
      const triggerConfig: Record<string, any> = {};
      if (triggerType === "TASK_STATUS_CHANGED" && triggerStatusId) {
        triggerConfig.toStatusId = triggerStatusId;
      } else if (triggerType === "TASK_UPDATED" && triggerPriority) {
        triggerConfig.priority = triggerPriority;
      }

      const actionConfig: Record<string, any> = {};
      if (actionType === "ASSIGN_TASK") {
        actionConfig.userId = actionAssigneeId;
      } else if (actionType === "CHANGE_STATUS") {
        actionConfig.statusId = actionStatusId;
      } else if (actionType === "CHANGE_PRIORITY") {
        actionConfig.priority = actionPriority;
      } else if (actionType === "SEND_NOTIFICATION") {
        actionConfig.title = actionAlertTitle;
        actionConfig.message = actionAlertMessage;
      } else if (actionType === "ADD_COMMENT") {
        actionConfig.content = actionComment;
      }

      const created = await automationRulesApi.createRule({
        name: name.trim(),
        description: description.trim(),
        triggerType,
        triggerConfig,
        actionType,
        actionConfig,
        projectId,
        workspaceId,
      });

      setRules([created, ...rules]);
      toast.success("Automation rule created successfully!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save automation rule");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusName = (id: string) => {
    return statuses.find((s) => s.id === id)?.name || id;
  };

  const getMemberName = (id: string) => {
    const m = projectMembers.find((item) => item.id === id || item.user?.id === id);
    if (!m) return id;
    if (m.user) return `${m.user.firstName} ${m.user.lastName}`;
    return `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-none bg-[var(--card)] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[var(--foreground)]">
              <HiBolt className="w-6 h-6 text-amber-500" />
              Workflow Automations (Tự động hóa Quy trình)
            </CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Cấu hình kịch bản If-This-Then-That tự động thực thi khi task thay đổi trạng thái, độ ưu tiên hoặc người phụ trách.
            </p>
          </div>
          <ActionButton
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 cursor-pointer"
          >
            <HiPlus className="w-4 h-4" />
            <span>New Rule</span>
          </ActionButton>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Quick 1-Click Templates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <HiSparkles className="w-4 h-4 text-purple-500" />
              <span>Recommended Automation Templates (Mẫu kịch bản thông minh)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => handleUseTemplate("qa_done")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                      <HiCheckCircle className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      Auto-Assign QA on Done
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Khi task chuyển sang <b>DONE</b> ➔ Tự gán Tester kiểm thử và ghi log hoàn thành.
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-[var(--primary)] gap-1">
                  <span>Use Template</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => handleUseTemplate("urgent_highest")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-red-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                      <HiShieldExclamation className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-red-500 transition-colors">
                      Urgent Alert on Highest
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Khi Priority đặt mức <b>HIGHEST</b> ➔ Bắn chuông cảnh báo khẩn cấp tức thì.
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-red-500 gap-1">
                  <span>Use Template</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => handleUseTemplate("auto_in_progress")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <HiUserGroup className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-blue-500 transition-colors">
                      Auto Start on Assign
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Khi task được phân bổ người thực hiện ➔ Tự động chuyển status sang <b>IN PROGRESS</b>.
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-blue-500 gap-1">
                  <span>Use Template</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Rules List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-[var(--foreground)]">
                Active Rules ({rules.length})
              </Label>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)] animate-pulse">
                Loading automation rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded-xl p-8 text-center space-y-3">
                <HiBolt className="w-10 h-10 text-[var(--muted-foreground)]/50 mx-auto" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Chưa có quy tắc tự động nào được thiết lập.
                </p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                  Hãy chọn một mẫu kịch bản ở trên hoặc bấm &quot;New Rule&quot; để thiết lập chu trình tự động hóa If-This-Then-That đầu tiên.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/10 transition-colors gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">
                          {rule.name}
                        </h4>
                        <Badge
                          variant={rule.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.status}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {rule.description}
                        </p>
                      )}

                      {/* Visual Trigger -> Action Flow */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                          IF
                        </span>
                        <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 font-mono">
                          {rule.triggerType}
                          {rule.triggerConfig?.toStatusId && ` ➔ ${getStatusName(rule.triggerConfig.toStatusId)}`}
                          {rule.triggerConfig?.priority && ` ➔ ${rule.triggerConfig.priority}`}
                        </Badge>

                        <HiArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />

                        <span className="font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                          THEN
                        </span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-mono">
                          {rule.actionType}
                          {rule.actionConfig?.userId && ` ➔ ${getMemberName(rule.actionConfig.userId)}`}
                          {rule.actionConfig?.statusId && ` ➔ ${getStatusName(rule.actionConfig.statusId)}`}
                          {rule.actionConfig?.priority && ` ➔ ${rule.actionConfig.priority}`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[var(--muted-foreground)] pt-1">
                        <span>Executed: {rule.executionCount || 0} times</span>
                        {rule.lastExecuted && (
                          <span>
                            Last run: {formatDateTimeForDisplay(rule.lastExecuted, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenHistory(rule)}
                        className="text-xs flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        <HiClock className="w-4 h-4" />
                        <span>History</span>
                      </Button>

                      <ToggleSwitch
                        checked={rule.status === "ACTIVE"}
                        onChange={() => handleToggle(rule.id)}
                        size="sm"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        title="Delete rule"
                      >
                        <HiTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Rule Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full sm:max-w-lg bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
              <HiBolt className="w-5 h-5 text-amber-500" />
              <span>Create Automation Rule</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--muted-foreground)]">
              Định nghĩa kịch bản tự động khi điều kiện xảy ra.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Assign QA When Task Is Done"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-desc">Description (Optional)</Label>
              <Textarea
                id="rule-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what this automation does..."
                rows={2}
              />
            </div>

            {/* Trigger Section */}
            <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--primary)] inline-block"></span>
                WHEN (TRIGGER)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Event</Label>
                  <Select value={triggerType} onValueChange={(val: any) => setTriggerType(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Trigger Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TASK_STATUS_CHANGED">Task Status Changes</SelectItem>
                      <SelectItem value="TASK_UPDATED">Task Priority Changes</SelectItem>
                      <SelectItem value="TASK_CREATED">Task Is Created</SelectItem>
                      <SelectItem value="TASK_ASSIGNED">Task Is Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerType === "TASK_STATUS_CHANGED" && (
                  <div>
                    <Label className="text-xs mb-1 block">To Status</Label>
                    <Select value={triggerStatusId} onValueChange={setTriggerStatusId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {triggerType === "TASK_UPDATED" && (
                  <div>
                    <Label className="text-xs mb-1 block">To Priority</Label>
                    <Select value={triggerPriority} onValueChange={setTriggerPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGHEST">HIGHEST</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="LOW">LOW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Action Section */}
            <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-green-500 inline-block"></span>
                THEN (ACTION)
              </Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1 block">Action Type</Label>
                  <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGN_TASK">Assign Task to Member</SelectItem>
                      <SelectItem value="SEND_NOTIFICATION">Send Urgent Notification</SelectItem>
                      <SelectItem value="CHANGE_STATUS">Change Task Status</SelectItem>
                      <SelectItem value="CHANGE_PRIORITY">Change Task Priority</SelectItem>
                      <SelectItem value="ADD_COMMENT">Add Automated Comment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {actionType === "ASSIGN_TASK" && (
                  <div>
                    <Label className="text-xs mb-1 block">Assign To Member</Label>
                    <Select value={actionAssigneeId} onValueChange={setActionAssigneeId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Member" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectMembers.map((m) => {
                          const mId = m.user?.id || m.id;
                          const mName = m.user
                            ? `${m.user.firstName} ${m.user.lastName}`
                            : `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.name || mId;
                          return (
                            <SelectItem key={mId} value={mId}>
                              {mName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "CHANGE_STATUS" && (
                  <div>
                    <Label className="text-xs mb-1 block">New Status</Label>
                    <Select value={actionStatusId} onValueChange={setActionStatusId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "CHANGE_PRIORITY" && (
                  <div>
                    <Label className="text-xs mb-1 block">New Priority</Label>
                    <Select value={actionPriority} onValueChange={setActionPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGHEST">HIGHEST</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="LOW">LOW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "SEND_NOTIFICATION" && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs mb-1 block">Notification Title</Label>
                      <Input
                        value={actionAlertTitle}
                        onChange={(e) => setActionAlertTitle(e.target.value)}
                        placeholder="Urgent Task Alert"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Notification Message</Label>
                      <Input
                        value={actionAlertMessage}
                        onChange={(e) => setActionAlertMessage(e.target.value)}
                        placeholder="Task requires immediate review!"
                      />
                    </div>
                  </div>
                )}

                {actionType === "ADD_COMMENT" && (
                  <div>
                    <Label className="text-xs mb-1 block">Comment Text</Label>
                    <Textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder="Enter comment content..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <ActionButton onClick={handleSaveRule} disabled={submitting}>
              {submitting ? "Saving..." : "Create Rule"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="w-full sm:max-w-lg bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
              <HiClock className="w-5 h-5 text-[var(--primary)]" />
              <span>Execution History: {selectedRule?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--muted-foreground)]">
              Lịch sử các lần kích hoạt và thực thi kịch bản tự động hóa.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[350px] overflow-y-auto space-y-2 py-2">
            {loadingExecutions ? (
              <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">
                Loading history...
              </div>
            ) : executions.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có lần chạy nào được ghi nhận cho rule này.
              </div>
            ) : (
              executions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {exec.success ? (
                      <HiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <HiXCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        {exec.success ? "Success" : "Failed"}
                      </p>
                      <p className="text-[var(--muted-foreground)] text-[11px]">
                        {formatDateTimeForDisplay(exec.createdAt, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      {exec.errorMessage && (
                        <p className="text-red-500 text-[11px] mt-0.5">{exec.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className="font-mono text-[10px]">
                    {exec.executionTime}ms
                  </Badge>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

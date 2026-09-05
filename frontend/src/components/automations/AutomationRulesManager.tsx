import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("project-settings");

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
      toast.error(t("automations.load_failed"));
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
          ? t("automations.toggle_active")
          : t("automations.toggle_inactive")
      );
    } catch (error) {
      toast.error(t("automations.toggle_failed"));
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm(t("automations.confirm_delete"))) return;
    try {
      await automationRulesApi.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success(t("automations.delete_success"));
    } catch (error) {
      toast.error(t("automations.delete_failed"));
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
      toast.error(t("automations.history.loading"));
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
    setActionAlertTitle(t("automations.modal.action_notif_title_placeholder"));
    setActionAlertMessage(t("automations.modal.action_notif_msg_placeholder"));
    setActionComment(t("automations.modal.action_comment_placeholder"));
    setIsModalOpen(true);
  };

  const handleUseTemplate = (templateType: "qa_done" | "urgent_highest" | "auto_in_progress") => {
    if (templateType === "qa_done") {
      const doneStatus =
        statuses.find(
          (s) =>
            s.name?.toLowerCase().includes("done") ||
            s.name?.toLowerCase().includes("xong") ||
            s.name?.toLowerCase().includes("hoàn thành")
        ) || statuses[statuses.length - 1];
      const member = projectMembers[0];
      const memberId = member?.user?.id || member?.id || "";

      setName(t("automations.templates.qa_done_title"));
      setDescription(t("automations.templates.qa_done_desc"));
      setTriggerType("TASK_STATUS_CHANGED");
      setTriggerStatusId(doneStatus?.id || "");
      setActionType("ASSIGN_TASK");
      setActionAssigneeId(memberId);
    } else if (templateType === "urgent_highest") {
      setName(t("automations.templates.urgent_highest_title"));
      setDescription(t("automations.templates.urgent_highest_desc"));
      setTriggerType("TASK_UPDATED");
      setTriggerPriority("HIGHEST");
      setActionType("SEND_NOTIFICATION");
      setActionAlertTitle(t("automations.modal.action_notif_title_placeholder"));
      setActionAlertMessage(t("automations.modal.action_notif_msg_placeholder"));
    } else if (templateType === "auto_in_progress") {
      const inProgStatus =
        statuses.find(
          (s) =>
            s.name?.toLowerCase().includes("progress") ||
            s.name?.toLowerCase().includes("đang")
        ) || statuses[0];
      setName(t("automations.templates.auto_in_progress_title"));
      setDescription(t("automations.templates.auto_in_progress_desc"));
      setTriggerType("TASK_ASSIGNED");
      setActionType("CHANGE_STATUS");
      setActionStatusId(inProgStatus?.id || "");
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!name.trim()) {
      toast.error(t("automations.modal.validation_name_required"));
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
      toast.success(t("automations.modal.create_success"));
      setIsModalOpen(false);
    } catch (error) {
      toast.error(t("automations.modal.create_failed"));
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

  const getPriorityLabel = (priority: string) => {
    return t(`automations.priorities.${priority}`, priority);
  };

  const getTriggerLabel = (type: TriggerType) => {
    return t(`automations.triggers.${type}`, type);
  };

  const getActionLabel = (type: ActionType) => {
    return t(`automations.actions.${type}`, type);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-none bg-[var(--card)] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-[var(--foreground)]">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <HiBolt className="w-5 h-5" />
              </div>
              <span>{t("automations.title")}</span>
            </CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("automations.subtitle")}
            </p>
          </div>
          <ActionButton
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <HiPlus className="w-4 h-4" />
            <span>{t("automations.new_rule")}</span>
          </ActionButton>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Quick 1-Click Templates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <HiSparkles className="w-4 h-4 text-purple-500" />
              <span>{t("automations.templates_title")}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* QA Done Template */}
              <div
                onClick={() => handleUseTemplate("qa_done")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                      <HiCheckCircle className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {t("automations.templates.qa_done_title")}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {t("automations.templates.qa_done_desc")}
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-[var(--primary)] gap-1 pt-1">
                  <span>{t("automations.templates.use_template")}</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Urgent Alert Template */}
              <div
                onClick={() => handleUseTemplate("urgent_highest")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-red-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                      <HiShieldExclamation className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-red-500 transition-colors">
                      {t("automations.templates.urgent_highest_title")}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {t("automations.templates.urgent_highest_desc")}
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-red-500 gap-1 pt-1">
                  <span>{t("automations.templates.use_template")}</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Auto In-Progress Template */}
              <div
                onClick={() => handleUseTemplate("auto_in_progress")}
                className="group p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <HiUserGroup className="w-4 h-4" />
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-blue-500 transition-colors">
                      {t("automations.templates.auto_in_progress_title")}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {t("automations.templates.auto_in_progress_desc")}
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-blue-500 gap-1 pt-1">
                  <span>{t("automations.templates.use_template")}</span>
                  <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Rules List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-[var(--foreground)]">
                {t("automations.active_rules_title", { count: rules.length })}
              </Label>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)] animate-pulse">
                {t("automations.loading")}
              </div>
            ) : rules.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded-xl p-8 text-center space-y-3">
                <HiBolt className="w-10 h-10 text-[var(--muted-foreground)]/50 mx-auto" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {t("automations.empty_title")}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                  {t("automations.empty_desc")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-all gap-4 shadow-xs"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">
                          {rule.name}
                        </h4>
                        <Badge
                          variant={rule.status === "ACTIVE" ? "default" : "secondary"}
                          className={`text-xs font-medium px-2 py-0.5 ${
                            rule.status === "ACTIVE"
                              ? "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/20"
                              : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {rule.status === "ACTIVE"
                            ? t("automations.status_active")
                            : t("automations.status_inactive")}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {rule.description}
                        </p>
                      )}

                      {/* Visual Trigger -> Action Flow */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                          {t("automations.flow.if")}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-medium text-xs px-2.5 py-1"
                        >
                          {getTriggerLabel(rule.triggerType)}
                          {rule.triggerConfig?.toStatusId &&
                            ` ➔ ${getStatusName(rule.triggerConfig.toStatusId)}`}
                          {rule.triggerConfig?.priority &&
                            ` ➔ ${getPriorityLabel(rule.triggerConfig.priority)}`}
                        </Badge>

                        <HiArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />

                        <span className="font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                          {t("automations.flow.then")}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium text-xs px-2.5 py-1"
                        >
                          {getActionLabel(rule.actionType)}
                          {rule.actionConfig?.userId &&
                            ` ➔ ${getMemberName(rule.actionConfig.userId)}`}
                          {rule.actionConfig?.statusId &&
                            ` ➔ ${getStatusName(rule.actionConfig.statusId)}`}
                          {rule.actionConfig?.priority &&
                            ` ➔ ${getPriorityLabel(rule.actionConfig.priority)}`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[var(--muted-foreground)] pt-0.5">
                        <span>{t("automations.executed_count", { count: rule.executionCount || 0 })}</span>
                        {rule.lastExecuted && (
                          <span>
                            {t("automations.last_run", {
                              time: formatDateTimeForDisplay(rule.lastExecuted, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenHistory(rule)}
                        className="text-xs flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] cursor-pointer"
                      >
                        <HiClock className="w-4 h-4" />
                        <span>{t("automations.btn_history")}</span>
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
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer"
                        title={t("automations.btn_delete")}
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
        <DialogContent className="w-full sm:max-w-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl p-6 backdrop-blur-xl">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-[var(--border)]">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-[var(--foreground)]">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HiBolt className="w-5 h-5" />
              </div>
              <span>{t("automations.modal.create_title")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--muted-foreground)]">
              {t("automations.modal.create_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name" className="text-xs font-semibold text-[var(--foreground)]">
                {t("automations.modal.name_label")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("automations.modal.name_placeholder")}
                className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20 h-10 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-desc" className="text-xs font-semibold text-[var(--foreground)]">
                {t("automations.modal.desc_label")}
              </Label>
              <Textarea
                id="rule-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("automations.modal.desc_placeholder")}
                rows={2}
                className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20 rounded-lg text-sm resize-none"
              />
            </div>

            {/* Trigger Section */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span className="size-2 rounded-full bg-amber-500 inline-block" />
                  {t("automations.modal.trigger_section_badge")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--foreground)]">
                    {t("automations.modal.trigger_event_label")}
                  </Label>
                  <Select value={triggerType} onValueChange={(val: any) => setTriggerType(val)}>
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                      <SelectValue placeholder={t("automations.modal.trigger_event_placeholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[14rem]">
                      <SelectItem
                        value="TASK_STATUS_CHANGED"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.triggers.TASK_STATUS_CHANGED")}
                      </SelectItem>
                      <SelectItem
                        value="TASK_UPDATED"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.triggers.TASK_UPDATED")}
                      </SelectItem>
                      <SelectItem
                        value="TASK_CREATED"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.triggers.TASK_CREATED")}
                      </SelectItem>
                      <SelectItem
                        value="TASK_ASSIGNED"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.triggers.TASK_ASSIGNED")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerType === "TASK_STATUS_CHANGED" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.trigger_status_label")}
                    </Label>
                    <Select value={triggerStatusId} onValueChange={setTriggerStatusId}>
                      <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                        <SelectValue placeholder={t("automations.modal.trigger_status_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[14rem]">
                        {statuses.map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id}
                            className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {triggerType === "TASK_UPDATED" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.trigger_priority_label")}
                    </Label>
                    <Select value={triggerPriority} onValueChange={setTriggerPriority}>
                      <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                        <SelectValue placeholder={t("automations.modal.trigger_priority_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[14rem]">
                        <SelectItem
                          value="HIGHEST"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("HIGHEST")}
                        </SelectItem>
                        <SelectItem
                          value="HIGH"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("HIGH")}
                        </SelectItem>
                        <SelectItem
                          value="MEDIUM"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("MEDIUM")}
                        </SelectItem>
                        <SelectItem
                          value="LOW"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("LOW")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Action Section */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                  {t("automations.modal.action_section_badge")}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--foreground)]">
                    {t("automations.modal.action_type_label")}
                  </Label>
                  <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                    <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                      <SelectValue placeholder={t("automations.modal.action_type_placeholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[15rem]">
                      <SelectItem
                        value="ASSIGN_TASK"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.actions.ASSIGN_TASK")}
                      </SelectItem>
                      <SelectItem
                        value="SEND_NOTIFICATION"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.actions.SEND_NOTIFICATION")}
                      </SelectItem>
                      <SelectItem
                        value="CHANGE_STATUS"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.actions.CHANGE_STATUS")}
                      </SelectItem>
                      <SelectItem
                        value="CHANGE_PRIORITY"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.actions.CHANGE_PRIORITY")}
                      </SelectItem>
                      <SelectItem
                        value="ADD_COMMENT"
                        className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                      >
                        {t("automations.actions.ADD_COMMENT")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {actionType === "ASSIGN_TASK" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.action_assignee_label")}
                    </Label>
                    <Select value={actionAssigneeId} onValueChange={setActionAssigneeId}>
                      <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                        <SelectValue placeholder={t("automations.modal.action_assignee_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[15rem]">
                        {projectMembers.map((m) => {
                          const mId = m.user?.id || m.id;
                          const mName = m.user
                            ? `${m.user.firstName} ${m.user.lastName}`
                            : `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.name || mId;
                          return (
                            <SelectItem
                              key={mId}
                              value={mId}
                              className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                            >
                              {mName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "CHANGE_STATUS" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.action_status_label")}
                    </Label>
                    <Select value={actionStatusId} onValueChange={setActionStatusId}>
                      <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                        <SelectValue placeholder={t("automations.modal.action_status_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[15rem]">
                        {statuses.map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id}
                            className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "CHANGE_PRIORITY" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.action_priority_label")}
                    </Label>
                    <Select value={actionPriority} onValueChange={setActionPriority}>
                      <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg shadow-xs hover:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all">
                        <SelectValue placeholder={t("automations.modal.action_priority_placeholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl z-50 text-[var(--foreground)] p-1.5 min-w-[15rem]">
                        <SelectItem
                          value="HIGHEST"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("HIGHEST")}
                        </SelectItem>
                        <SelectItem
                          value="HIGH"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("HIGH")}
                        </SelectItem>
                        <SelectItem
                          value="MEDIUM"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("MEDIUM")}
                        </SelectItem>
                        <SelectItem
                          value="LOW"
                          className="py-2 px-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer"
                        >
                          {getPriorityLabel("LOW")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === "SEND_NOTIFICATION" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[var(--foreground)]">
                        {t("automations.modal.action_notif_title_label")}
                      </Label>
                      <Input
                        value={actionAlertTitle}
                        onChange={(e) => setActionAlertTitle(e.target.value)}
                        placeholder={t("automations.modal.action_notif_title_placeholder")}
                        className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[var(--foreground)]">
                        {t("automations.modal.action_notif_msg_label")}
                      </Label>
                      <Input
                        value={actionAlertMessage}
                        onChange={(e) => setActionAlertMessage(e.target.value)}
                        placeholder={t("automations.modal.action_notif_msg_placeholder")}
                        className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] h-10 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                {actionType === "ADD_COMMENT" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--foreground)]">
                      {t("automations.modal.action_comment_label")}
                    </Label>
                    <Textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder={t("automations.modal.action_comment_placeholder")}
                      rows={2}
                      className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[var(--border)]">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] cursor-pointer rounded-lg px-4"
            >
              {t("automations.modal.btn_cancel")}
            </Button>
            <ActionButton
              onClick={handleSaveRule}
              disabled={submitting}
              className="cursor-pointer rounded-lg px-5 shadow-sm"
            >
              {submitting ? t("automations.modal.btn_saving") : t("automations.modal.btn_create")}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="w-full sm:max-w-lg bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl p-6 backdrop-blur-xl">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-[var(--border)]">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-[var(--foreground)]">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <HiClock className="w-5 h-5" />
              </div>
              <span>
                {t("automations.history.title")}:{" "}
                <span className="text-[var(--primary)]">{selectedRule?.name}</span>
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--muted-foreground)]">
              {t("automations.history.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[380px] overflow-y-auto space-y-2.5 py-3 pr-1">
            {loadingExecutions ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)] animate-pulse">
                {t("automations.history.loading")}
              </div>
            ) : executions.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)] space-y-2">
                <HiClock className="w-8 h-8 opacity-30 mx-auto" />
                <p>{t("automations.history.empty")}</p>
              </div>
            ) : (
              executions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 hover:bg-[var(--muted)]/10 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    {exec.success ? (
                      <div className="p-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
                        <HiCheckCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex-shrink-0">
                        <HiXCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <span>
                          {exec.success
                            ? t("automations.history.success")
                            : t("automations.history.failed")}
                        </span>
                      </p>
                      <p className="text-[var(--muted-foreground)] text-[11px] pt-0.5">
                        {formatDateTimeForDisplay(exec.createdAt, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      {exec.errorMessage && (
                        <p className="text-red-500 text-[11px] mt-1 bg-red-500/5 p-1.5 rounded border border-red-500/10 font-mono">
                          {exec.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] px-2 py-0.5 bg-[var(--card)] border-[var(--border)]"
                  >
                    {exec.executionTime}ms
                  </Badge>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-[var(--border)]">
            <Button
              variant="outline"
              onClick={() => setIsHistoryOpen(false)}
              className="border-[var(--border)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg px-4 cursor-pointer"
            >
              {t("automations.history.btn_close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

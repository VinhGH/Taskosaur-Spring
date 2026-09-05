import api from "@/lib/api";

export type TriggerType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_DUE_DATE_APPROACHING"
  | "TASK_OVERDUE"
  | "SPRINT_STARTED"
  | "SPRINT_COMPLETED"
  | "PROJECT_CREATED"
  | "COMMENT_ADDED";

export type ActionType =
  | "ASSIGN_TASK"
  | "CHANGE_STATUS"
  | "ADD_LABEL"
  | "REMOVE_LABEL"
  | "SET_DUE_DATE"
  | "SEND_NOTIFICATION"
  | "SEND_EMAIL"
  | "ADD_COMMENT"
  | "MOVE_TO_SPRINT"
  | "CHANGE_PRIORITY";

export type RuleStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  status: RuleStatus;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  actionType: ActionType;
  actionConfig?: Record<string, any>;
  projectId: string;
  workspaceId?: string;
  organizationId?: string;
  executionCount: number;
  lastExecuted?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  actionType: ActionType;
  actionConfig?: Record<string, any>;
  projectId: string;
  workspaceId?: string;
  organizationId?: string;
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  status?: RuleStatus;
  triggerType?: TriggerType;
  triggerConfig?: Record<string, any>;
  actionType?: ActionType;
  actionConfig?: Record<string, any>;
}

export interface RuleExecution {
  id: string;
  success: boolean;
  errorMessage?: string;
  executionTime: number;
  triggerData?: string;
  actionResult?: string;
  ruleId: string;
  triggeredById?: string;
  createdAt: string;
}

export const automationRulesApi = {
  getRulesByProject: async (projectId: string): Promise<AutomationRule[]> => {
    try {
      const response = await api.get<AutomationRule[]>(`/automation-rules/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error("Get automation rules error:", error);
      throw error;
    }
  },

  createRule: async (data: CreateAutomationRuleDto): Promise<AutomationRule> => {
    try {
      const response = await api.post<AutomationRule>("/automation-rules", data);
      return response.data;
    } catch (error) {
      console.error("Create automation rule error:", error);
      throw error;
    }
  },

  updateRule: async (id: string, data: UpdateAutomationRuleDto): Promise<AutomationRule> => {
    try {
      const response = await api.put<AutomationRule>(`/automation-rules/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update automation rule error:", error);
      throw error;
    }
  },

  toggleRule: async (id: string): Promise<AutomationRule> => {
    try {
      const response = await api.patch<AutomationRule>(`/automation-rules/${id}/toggle`, {});
      return response.data;
    } catch (error) {
      console.error("Toggle automation rule error:", error);
      throw error;
    }
  },

  deleteRule: async (id: string): Promise<void> => {
    try {
      await api.delete(`/automation-rules/${id}`);
    } catch (error) {
      console.error("Delete automation rule error:", error);
      throw error;
    }
  },

  getRuleExecutions: async (id: string): Promise<RuleExecution[]> => {
    try {
      const response = await api.get<RuleExecution[]>(`/automation-rules/${id}/executions`);
      return response.data;
    } catch (error) {
      console.error("Get rule executions error:", error);
      throw error;
    }
  },
};

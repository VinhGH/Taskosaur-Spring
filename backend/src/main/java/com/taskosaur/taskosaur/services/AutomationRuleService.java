package com.taskosaur.taskosaur.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskosaur.taskosaur.dto.automation.AutomationRuleResponse;
import com.taskosaur.taskosaur.dto.automation.CreateAutomationRuleRequest;
import com.taskosaur.taskosaur.dto.automation.UpdateAutomationRuleRequest;
import com.taskosaur.taskosaur.dto.notification.CreateNotificationParams;
import com.taskosaur.taskosaur.enums.*;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutomationRuleService {

    private final AutomationRuleRepository automationRuleRepository;
    private final RuleExecutionRepository ruleExecutionRepository;
    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public AutomationRuleResponse createRule(CreateAutomationRuleRequest request, String userId) {
        String triggerConfigJson = writeJson(request.getTriggerConfig());
        String actionConfigJson = writeJson(request.getActionConfig());

        AutomationRule rule = AutomationRule.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .status(RuleStatus.ACTIVE)
                .triggerType(request.getTriggerType())
                .triggerConfig(triggerConfigJson)
                .actionType(request.getActionType())
                .actionConfig(actionConfigJson)
                .projectId(request.getProjectId())
                .workspaceId(request.getWorkspaceId())
                .organizationId(request.getOrganizationId())
                .executionCount(0)
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        AutomationRule saved = automationRuleRepository.save(rule);
        return toResponse(saved);
    }

    public List<AutomationRuleResponse> getRulesByProject(String projectId) {
        return automationRuleRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    public AutomationRuleResponse getRuleById(String id) {
        AutomationRule rule = automationRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found with id: " + id));
        return toResponse(rule);
    }

    public AutomationRuleResponse updateRule(String id, UpdateAutomationRuleRequest request, String userId) {
        AutomationRule rule = automationRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            rule.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            rule.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            rule.setStatus(request.getStatus());
        }
        if (request.getTriggerType() != null) {
            rule.setTriggerType(request.getTriggerType());
        }
        if (request.getTriggerConfig() != null) {
            rule.setTriggerConfig(writeJson(request.getTriggerConfig()));
        }
        if (request.getActionType() != null) {
            rule.setActionType(request.getActionType());
        }
        if (request.getActionConfig() != null) {
            rule.setActionConfig(writeJson(request.getActionConfig()));
        }
        rule.setUpdatedBy(userId);

        AutomationRule updated = automationRuleRepository.save(rule);
        return toResponse(updated);
    }

    public AutomationRuleResponse toggleRuleStatus(String id, String userId) {
        AutomationRule rule = automationRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found with id: " + id));

        RuleStatus newStatus = rule.getStatus() == RuleStatus.ACTIVE ? RuleStatus.INACTIVE : RuleStatus.ACTIVE;
        rule.setStatus(newStatus);
        rule.setUpdatedBy(userId);

        AutomationRule updated = automationRuleRepository.save(rule);
        return toResponse(updated);
    }

    public void deleteRule(String id) {
        AutomationRule rule = automationRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Automation rule not found with id: " + id));
        automationRuleRepository.delete(rule);
    }

    public List<RuleExecution> getRuleExecutions(String ruleId) {
        return ruleExecutionRepository.findByRuleIdOrderByCreatedAtDesc(ruleId);
    }

    /**
     * Evaluates and executes active automation rules matching the given trigger and conditions.
     */
    @Async
    @Transactional
    public void evaluateRules(TriggerType triggerType, Task task, Map<String, Object> context, String triggeredByUserId) {
        if (task == null || task.getProjectId() == null) {
            return;
        }

        List<AutomationRule> activeRules = automationRuleRepository.findByProjectIdAndStatusAndTriggerType(
                task.getProjectId(),
                RuleStatus.ACTIVE,
                triggerType
        );

        for (AutomationRule rule : activeRules) {
            try {
                if (matchesCondition(rule, task, context)) {
                    executeRule(rule, task, context, triggeredByUserId);
                }
            } catch (Exception e) {
                log.error("Failed to evaluate rule {} on task {}: {}", rule.getId(), task.getId(), e.getMessage());
            }
        }
    }

    private boolean matchesCondition(AutomationRule rule, Task task, Map<String, Object> context) {
        Map<String, Object> triggerConfig = parseJson(rule.getTriggerConfig());
        if (triggerConfig.isEmpty()) {
            return true;
        }

        // Check target status matching (for TASK_STATUS_CHANGED)
        if (triggerConfig.containsKey("toStatusId")) {
            String expectedToStatus = String.valueOf(triggerConfig.get("toStatusId"));
            Object newStatus = context.get("newStatusId");
            if (newStatus != null && !expectedToStatus.equalsIgnoreCase(String.valueOf(newStatus))) {
                return false;
            }
            if (newStatus == null && !expectedToStatus.equalsIgnoreCase(task.getStatusId())) {
                return false;
            }
        }

        // Check target priority matching
        if (triggerConfig.containsKey("priority")) {
            String expectedPriority = String.valueOf(triggerConfig.get("priority"));
            if (task.getPriority() == null || !expectedPriority.equalsIgnoreCase(task.getPriority().name())) {
                return false;
            }
        }

        // Check task type matching
        if (triggerConfig.containsKey("type")) {
            String expectedType = String.valueOf(triggerConfig.get("type"));
            if (task.getType() == null || !expectedType.equalsIgnoreCase(task.getType().name())) {
                return false;
            }
        }

        return true;
    }

    private void executeRule(AutomationRule rule, Task task, Map<String, Object> context, String triggeredByUserId) {
        long startTime = System.currentTimeMillis();
        boolean success = true;
        String errorMessage = null;
        Map<String, Object> actionResult = new HashMap<>();

        try {
            Map<String, Object> actionConfig = parseJson(rule.getActionConfig());
            switch (rule.getActionType()) {
                case ASSIGN_TASK -> {
                    String assigneeId = (String) actionConfig.getOrDefault("userId", actionConfig.get("assigneeId"));
                    if (assigneeId != null && !assigneeId.isBlank()) {
                        if (!taskAssigneeRepository.existsByTaskIdAndUserId(task.getId(), assigneeId)) {
                            taskAssigneeRepository.save(TaskAssignee.builder()
                                    .taskId(task.getId())
                                    .userId(assigneeId)
                                    .build());
                            try {
                                notificationService.notifyTaskAssigned(task, assigneeId, triggeredByUserId);
                            } catch (Exception ne) {
                                log.warn("Notification dispatch failed during auto-assign: {}", ne.getMessage());
                            }
                            actionResult.put("assignedUserId", assigneeId);
                        }
                    }
                }
                case CHANGE_STATUS -> {
                    String targetStatusId = (String) actionConfig.get("statusId");
                    if (targetStatusId != null && !targetStatusId.isBlank()) {
                        task.setStatusId(targetStatusId);
                        taskRepository.save(task);
                        actionResult.put("newStatusId", targetStatusId);
                    }
                }
                case CHANGE_PRIORITY -> {
                    String priorityStr = (String) actionConfig.get("priority");
                    if (priorityStr != null) {
                        TaskPriority priority = TaskPriority.valueOf(priorityStr.toUpperCase());
                        task.setPriority(priority);
                        taskRepository.save(task);
                        actionResult.put("newPriority", priority.name());
                    }
                }
                case SEND_NOTIFICATION -> {
                    String title = (String) actionConfig.getOrDefault("title", "Automated Rule Alert");
                    String message = (String) actionConfig.getOrDefault("message", "Rule triggered for task " + task.getSlug());
                    String targetUserId = (String) actionConfig.get("recipientId");
                    if (targetUserId == null || targetUserId.isBlank()) {
                        targetUserId = triggeredByUserId != null ? triggeredByUserId : task.getCreatedBy();
                    }

                    if (targetUserId != null) {
                        notificationService.createNotification(CreateNotificationParams.builder()
                                .type(NotificationType.SYSTEM)
                                .priority(NotificationPriority.HIGH)
                                .title(title)
                                .message(message)
                                .entityType("TASK")
                                .entityId(task.getId())
                                .actionUrl("/tasks/" + (task.getSlug() != null ? task.getSlug() : task.getId()))
                                .userId(targetUserId)
                                .creatorId(triggeredByUserId)
                                .build());
                        actionResult.put("notificationSentTo", targetUserId);
                    }
                }
                case ADD_COMMENT -> {
                    String commentText = (String) actionConfig.getOrDefault("content", actionConfig.get("comment"));
                    if (commentText != null && !commentText.isBlank()) {
                        TaskComment comment = TaskComment.builder()
                                .content(commentText)
                                .taskId(task.getId())
                                .authorId(triggeredByUserId != null ? triggeredByUserId : task.getCreatedBy())
                                .createdBy(triggeredByUserId)
                                .build();
                        taskCommentRepository.save(comment);
                        actionResult.put("commentCreated", true);
                    }
                }
                case SET_DUE_DATE -> {
                    Number daysFromNow = (Number) actionConfig.get("daysFromNow");
                    Boolean markCompleted = (Boolean) actionConfig.get("markCompleted");
                    if (Boolean.TRUE.equals(markCompleted)) {
                        task.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
                    }
                    if (daysFromNow != null) {
                        task.setDueDate(LocalDateTime.now(ZoneOffset.UTC).plusDays(daysFromNow.longValue()));
                    }
                    taskRepository.save(task);
                    actionResult.put("updatedDueDate", task.getDueDate());
                    actionResult.put("completedAt", task.getCompletedAt());
                }
                default -> log.info("Action type {} not implemented in automation engine", rule.getActionType());
            }
        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            log.error("Execution failed for rule {}: {}", rule.getId(), e.getMessage(), e);
        }

        int executionDuration = (int) (System.currentTimeMillis() - startTime);

        // Record execution history
        try {
            RuleExecution execution = RuleExecution.builder()
                    .ruleId(rule.getId())
                    .success(success)
                    .errorMessage(errorMessage)
                    .executionTime(executionDuration)
                    .triggerData(writeJson(context))
                    .actionResult(writeJson(actionResult))
                    .triggeredById(triggeredByUserId)
                    .createdBy(triggeredByUserId)
                    .build();
            ruleExecutionRepository.save(execution);

            rule.setExecutionCount((rule.getExecutionCount() != null ? rule.getExecutionCount() : 0) + 1);
            rule.setLastExecuted(LocalDateTime.now(ZoneOffset.UTC));
            automationRuleRepository.save(rule);
        } catch (Exception le) {
            log.warn("Failed to record rule execution log: {}", le.getMessage());
        }
    }

    private AutomationRuleResponse toResponse(AutomationRule rule) {
        return AutomationRuleResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .description(rule.getDescription())
                .status(rule.getStatus())
                .triggerType(rule.getTriggerType())
                .triggerConfig(parseJson(rule.getTriggerConfig()))
                .actionType(rule.getActionType())
                .actionConfig(parseJson(rule.getActionConfig()))
                .organizationId(rule.getOrganizationId())
                .workspaceId(rule.getWorkspaceId())
                .projectId(rule.getProjectId())
                .executionCount(rule.getExecutionCount())
                .lastExecuted(rule.getLastExecuted())
                .createdBy(rule.getCreatedBy())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    private String writeJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Failed to write JSON map: {}", e.getMessage());
            return "{}";
        }
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}

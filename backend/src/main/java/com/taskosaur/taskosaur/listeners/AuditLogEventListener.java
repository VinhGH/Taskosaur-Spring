package com.taskosaur.taskosaur.listeners;

import com.taskosaur.taskosaur.dto.activity.LogActivityParams;
import com.taskosaur.taskosaur.events.ActivityLogEvent;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import com.taskosaur.taskosaur.services.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogEventListener {

    private final ActivityLogService activityLogService;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;

    @Async("auditTaskExecutor")
    @EventListener
    public void handleActivityLogEvent(ActivityLogEvent event) {
        try {
            String orgId = event.getOrganizationId();

            // Tự động resolve organizationId nếu chưa có
            if ((orgId == null || orgId.isBlank()) && event.getEntityId() != null) {
                orgId = resolveOrganizationId(event.getEntityType(), event.getEntityId(), event.getProjectId());
            }

            LogActivityParams params = LogActivityParams.builder()
                    .type(event.getType())
                    .description(event.getDescription())
                    .entityType(event.getEntityType())
                    .entityId(event.getEntityId())
                    .oldValue(event.getOldValue())
                    .newValue(event.getNewValue())
                    .userId(event.getUserId())
                    .organizationId(orgId)
                    .build();

            activityLogService.logActivity(params);
            log.info("Audit Log recorded: [{}] by user [{}] on [{}:{}]",
                    event.getType(), event.getUserId(), event.getEntityType(), event.getEntityId());
        } catch (Exception ex) {
            log.error("Failed to record async audit log for event [{}]: {}", event, ex.getMessage(), ex);
        }
    }

    private String resolveOrganizationId(String entityType, String entityId, String fallbackProjectId) {
        try {
            if ("TASK".equalsIgnoreCase(entityType)) {
                Task task = taskRepository.findById(entityId).orElse(null);
                if (task != null && task.getProjectId() != null) {
                    Project project = projectRepository.findById(task.getProjectId()).orElse(null);
                    if (project != null && project.getWorkspaceId() != null) {
                        Workspace workspace = workspaceRepository.findById(project.getWorkspaceId()).orElse(null);
                        if (workspace != null) return workspace.getOrganizationId();
                    }
                }
            } else if ("PROJECT".equalsIgnoreCase(entityType)) {
                Project project = projectRepository.findById(entityId).orElse(null);
                if (project != null && project.getWorkspaceId() != null) {
                    Workspace workspace = workspaceRepository.findById(project.getWorkspaceId()).orElse(null);
                    if (workspace != null) return workspace.getOrganizationId();
                }
            } else if ("WORKSPACE".equalsIgnoreCase(entityType)) {
                Workspace workspace = workspaceRepository.findById(entityId).orElse(null);
                if (workspace != null) return workspace.getOrganizationId();
            }

            if (fallbackProjectId != null && !fallbackProjectId.isBlank()) {
                Project project = projectRepository.findById(fallbackProjectId).orElse(null);
                if (project != null && project.getWorkspaceId() != null) {
                    Workspace workspace = workspaceRepository.findById(project.getWorkspaceId()).orElse(null);
                    if (workspace != null) return workspace.getOrganizationId();
                }
            }
        } catch (Exception e) {
            log.debug("Could not resolve organizationId for entity [{}]: {}", entityId, e.getMessage());
        }
        return null;
    }
}

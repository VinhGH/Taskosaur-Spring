package com.taskosaur.taskosaur.aspects;

import com.taskosaur.taskosaur.annotations.Auditable;
import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.dto.sprint.SprintResponse;
import com.taskosaur.taskosaur.dto.task.TaskResponse;
import com.taskosaur.taskosaur.enums.ActivityType;
import com.taskosaur.taskosaur.events.ActivityLogEvent;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final ApplicationEventPublisher eventPublisher;
    private final TaskRepository taskRepository;
    private final TaskStatusRepository taskStatusRepository;

    @Around("@annotation(auditable)")
    public Object auditActivity(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        String actorUserId = resolveActorUserId(joinPoint.getArgs());
        Task preTaskSnapshot = null;
        String entityIdArg = null;

        // 1. Chụp ảnh trạng thái trước khi thực thi đối với các tác vụ update / status / delete
        try {
            if ("TASK".equalsIgnoreCase(auditable.entityType()) && joinPoint.getArgs().length > 0) {
                Object firstArg = joinPoint.getArgs()[0];
                if (firstArg instanceof String idOrSlug) {
                    entityIdArg = idOrSlug;
                    preTaskSnapshot = taskRepository.findById(idOrSlug).orElse(null);
                }
            }
        } catch (Exception e) {
            log.debug("Failed to take pre-execution snapshot: {}", e.getMessage());
        }

        // 2. Thực thi nghiệp vụ chính
        Object result = joinPoint.proceed();

        // 3. Xử lý sau khi nghiệp vụ hoàn tất thành công
        try {
            ActivityLogEvent event = buildActivityEvent(auditable, actorUserId, preTaskSnapshot, entityIdArg, result, joinPoint.getArgs());
            if (event != null) {
                eventPublisher.publishEvent(event);
            }
        } catch (Exception ex) {
            log.error("Failed to build or publish audit log event: {}", ex.getMessage(), ex);
        }

        return result;
    }

    private ActivityLogEvent buildActivityEvent(
            Auditable auditable,
            String actorUserId,
            Task preTask,
            String entityIdArg,
            Object result,
            Object[] args
    ) {
        ActivityType action = auditable.action();

        // ─── TÁC VỤ TASK ────────────────────────────────────────────────────────
        if (result instanceof TaskResponse taskResponse) {
            String taskId = taskResponse.getId();
            String title = taskResponse.getTitle() != null ? taskResponse.getTitle() : "Task";
            String projectId = taskResponse.getProjectId();

            if (action == ActivityType.TASK_CREATED) {
                return ActivityLogEvent.builder()
                        .userId(actorUserId)
                        .type(ActivityType.TASK_CREATED)
                        .entityType("TASK")
                        .entityId(taskId)
                        .projectId(projectId)
                        .newValue(title)
                        .description("Created task \"" + title + "\" (" + taskResponse.getSlug() + ")")
                        .build();
            }

            if (action == ActivityType.TASK_STATUS_CHANGED) {
                String oldStatusName = resolveStatusName(preTask != null ? preTask.getStatusId() : null);
                String newStatusName = taskResponse.getStatus() != null
                        ? taskResponse.getStatus().getName()
                        : resolveStatusName(taskResponse.getStatusId());

                return ActivityLogEvent.builder()
                        .userId(actorUserId)
                        .type(ActivityType.TASK_STATUS_CHANGED)
                        .entityType("TASK")
                        .entityId(taskId)
                        .projectId(projectId)
                        .oldValue(oldStatusName)
                        .newValue(newStatusName)
                        .description("Changed status from \"" + oldStatusName + "\" to \"" + newStatusName + "\"")
                        .build();
            }

            if (action == ActivityType.TASK_UPDATED) {
                String diffDesc = buildTaskUpdateDiff(preTask, taskResponse);
                return ActivityLogEvent.builder()
                        .userId(actorUserId)
                        .type(ActivityType.TASK_UPDATED)
                        .entityType("TASK")
                        .entityId(taskId)
                        .projectId(projectId)
                        .description(diffDesc)
                        .build();
            }
        }

        // ─── TÁC VỤ TASK DELETED ────────────────────────────────────────────────
        if (action == ActivityType.TASK_DELETED) {
            String taskTitle = preTask != null ? preTask.getTitle() : (entityIdArg != null ? entityIdArg : "Unknown");
            String projId = preTask != null ? preTask.getProjectId() : null;

            return ActivityLogEvent.builder()
                    .userId(actorUserId)
                    .type(ActivityType.TASK_DELETED)
                    .entityType("TASK")
                    .entityId(entityIdArg != null ? entityIdArg : (preTask != null ? preTask.getId() : "unknown"))
                    .projectId(projId)
                    .oldValue(taskTitle)
                    .description("Deleted task \"" + taskTitle + "\"")
                    .build();
        }

        // ─── TÁC VỤ PROJECT ──────────────────────────────────────────────────────
        if (result instanceof ProjectResponse projectResponse) {
            if (action == ActivityType.PROJECT_CREATED) {
                return ActivityLogEvent.builder()
                        .userId(actorUserId)
                        .type(ActivityType.PROJECT_CREATED)
                        .entityType("PROJECT")
                        .entityId(projectResponse.getId())
                        .projectId(projectResponse.getId())
                        .newValue(projectResponse.getName())
                        .description("Created project \"" + projectResponse.getName() + "\"")
                        .build();
            }
            if (action == ActivityType.PROJECT_UPDATED) {
                return ActivityLogEvent.builder()
                        .userId(actorUserId)
                        .type(ActivityType.PROJECT_UPDATED)
                        .entityType("PROJECT")
                        .entityId(projectResponse.getId())
                        .projectId(projectResponse.getId())
                        .newValue(projectResponse.getName())
                        .description("Updated project \"" + projectResponse.getName() + "\"")
                        .build();
            }
        }

        // ─── TÁC VỤ SPRINT ──────────────────────────────────────────────────────
        if (result instanceof SprintResponse sprintResponse) {
            ActivityType sprintAction = switch (sprintResponse.getStatus()) {
                case ACTIVE -> ActivityType.SPRINT_STARTED;
                case COMPLETED -> ActivityType.SPRINT_COMPLETED;
                default -> ActivityType.SPRINT_CREATED;
            };

            return ActivityLogEvent.builder()
                    .userId(actorUserId)
                    .type(sprintAction)
                    .entityType("SPRINT")
                    .entityId(sprintResponse.getId())
                    .projectId(sprintResponse.getProjectId())
                    .newValue(sprintResponse.getName())
                    .description(sprintAction == ActivityType.SPRINT_STARTED
                            ? "Started sprint \"" + sprintResponse.getName() + "\""
                            : (sprintAction == ActivityType.SPRINT_COMPLETED
                            ? "Completed sprint \"" + sprintResponse.getName() + "\""
                            : "Created sprint \"" + sprintResponse.getName() + "\""))
                    .build();
        }

        // ─── TÁC VỤ BÌNH LUẬN ──────────────────────────────────────────────────
        if (action == ActivityType.TASK_COMMENTED && args.length > 0) {
            String taskId = args[0] instanceof String s ? s : "unknown";
            return ActivityLogEvent.builder()
                    .userId(actorUserId)
                    .type(ActivityType.TASK_COMMENTED)
                    .entityType("TASK")
                    .entityId(taskId)
                    .description("Added a comment")
                    .build();
        }

        return null;
    }

    private String buildTaskUpdateDiff(Task oldTask, TaskResponse newTask) {
        if (oldTask == null) {
            return "Updated task \"" + newTask.getTitle() + "\"";
        }

        StringBuilder diff = new StringBuilder("Updated task: ");
        boolean hasDiff = false;

        if (!Objects.equals(oldTask.getTitle(), newTask.getTitle())) {
            diff.append("title to \"").append(newTask.getTitle()).append("\"; ");
            hasDiff = true;
        }

        if (oldTask.getPriority() != newTask.getPriority()) {
            diff.append("priority from ").append(oldTask.getPriority())
                    .append(" to ").append(newTask.getPriority()).append("; ");
            hasDiff = true;
        }

        if (!Objects.equals(oldTask.getSprintId(), newTask.getSprintId())) {
            diff.append("sprint assignment; ");
            hasDiff = true;
        }

        if (!Objects.equals(oldTask.getDueDate(), newTask.getDueDate())) {
            diff.append("due date; ");
            hasDiff = true;
        }

        if (!Objects.equals(oldTask.getStoryPoints(), newTask.getStoryPoints())) {
            diff.append("story points to ").append(newTask.getStoryPoints()).append("; ");
            hasDiff = true;
        }

        return hasDiff ? diff.toString().trim() : "Updated task details";
    }

    private String resolveStatusName(String statusId) {
        if (statusId == null || statusId.isBlank()) return "Unknown";
        return taskStatusRepository.findById(statusId)
                .map(TaskStatus::getName)
                .orElse(statusId);
    }

    private String resolveActorUserId(Object[] args) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }

        // Tìm kiếm tham số String userId trong method arguments
        for (Object arg : args) {
            if (arg instanceof String s && s.length() >= 30 && s.contains("-")) {
                return s;
            }
        }

        return "system";
    }
}

package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.notification.CreateNotificationParams;
import com.taskosaur.taskosaur.dto.notification.NotificationResponse;
import com.taskosaur.taskosaur.enums.NotificationPriority;
import com.taskosaur.taskosaur.enums.NotificationType;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.Notification;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskAssignee;
import com.taskosaur.taskosaur.models.TaskComment;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.NotificationRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskAssigneeRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketEventService webSocketEventService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    public Notification createNotification(CreateNotificationParams params) {
        Notification notification = Notification.builder()
                .type(params.getType())
                .priority(params.getPriority() != null ? params.getPriority() : NotificationPriority.MEDIUM)
                .title(params.getTitle())
                .message(params.getMessage())
                .entityType(params.getEntityType())
                .entityId(params.getEntityId())
                .actionUrl(params.getActionUrl())
                .userId(params.getUserId())
                .organizationId(params.getOrganizationId())
                .isRead(false)
                .createdBy(params.getCreatorId())
                .build();
        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public List<NotificationResponse> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot mark another user's notification as read");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now(ZoneOffset.UTC));
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    public NotificationResponse getNotificationById(String id, String userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (userId != null && !n.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot view another user's notification");
        }
        return buildResponse(n);
    }

    public void deleteNotification(String id, String userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (userId != null && !n.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot delete another user's notification");
        }
        notificationRepository.delete(n);
    }

    public void bulkDeleteNotifications(List<String> ids, String userId) {
        if (ids == null || ids.isEmpty()) return;
        for (String id : ids) {
            notificationRepository.findById(id).ifPresent(n -> {
                if (userId == null || n.getUserId().equals(userId)) {
                    notificationRepository.delete(n);
                }
            });
        }
    }

    private NotificationResponse buildResponse(Notification n) {
        NotificationResponse.UserSummaryDto userSummary = null;
        if (n.getCreatedBy() != null) {
            userSummary = userRepository.findById(n.getCreatedBy())
                    .map(u -> NotificationResponse.UserSummaryDto.builder()
                            .id(u.getId())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .avatar(u.getAvatar())
                            .build())
                    .orElse(null);
        }

        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .priority(n.getPriority())
                .isRead(n.getIsRead())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .actionUrl(n.getActionUrl())
                .userId(n.getUserId())
                .organizationId(n.getOrganizationId())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .createdByUser(userSummary)
                .build();
    }

    public NotificationResponse sendAndBroadcastNotification(CreateNotificationParams params) {
        Notification notification = createNotification(params);
        NotificationResponse response = buildResponse(notification);

        long unreadCount = getUnreadCount(params.getUserId());

        // 1. Broadcast via WebSocket STOMP
        try {
            webSocketEventService.notifyUserNotification(params.getUserId(), response, unreadCount);
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket notification to user {}: {}", params.getUserId(), e.getMessage());
        }

        // 2. Send Email notification
        try {
            userRepository.findById(params.getUserId()).ifPresent(recipient -> {
                String actorName = "Hệ thống";
                if (params.getCreatorId() != null) {
                    actorName = userRepository.findById(params.getCreatorId())
                            .map(this::getUserDisplayName)
                            .orElse("Một thành viên");
                }

                String baseUrl = frontendUrl != null ? frontendUrl : "http://localhost:3001";
                String actionUrl = params.getActionUrl() != null ? params.getActionUrl() : "";
                if (!actionUrl.startsWith("http")) {
                    actionUrl = baseUrl + (actionUrl.startsWith("/") ? "" : "/") + actionUrl;
                }

                String recipientName = getUserDisplayName(recipient);
                emailService.sendNotificationEmail(
                        recipient.getEmail(),
                        recipientName,
                        actorName,
                        params.getTitle(),
                        params.getMessage(),
                        actionUrl
                );
            });
        } catch (Exception e) {
            log.warn("Failed to trigger notification email to user {}: {}", params.getUserId(), e.getMessage());
        }

        return response;
    }

    public void notifyTaskAssigned(Task task, String assigneeId, String actorId) {
        if (assigneeId == null || assigneeId.isBlank() || assigneeId.equals(actorId)) {
            return;
        }

        Project project = task.getProjectId() != null
                ? projectRepository.findById(task.getProjectId()).orElse(null)
                : null;
        Workspace workspace = project != null && project.getWorkspaceId() != null
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;

        String wsSlug = workspace != null ? workspace.getSlug() : "default";
        String prjSlug = project != null ? project.getSlug() : "default";
        String actionUrl = "/" + wsSlug + "/" + prjSlug + "/tasks/" + task.getId();

        String actorName = actorId != null
                ? userRepository.findById(actorId).map(this::getUserDisplayName).orElse("Thành viên dự án")
                : "Thành viên dự án";

        String projectName = project != null ? project.getName() : "Dự án";
        String title = "Bạn được giao công việc: " + task.getTitle();
        String message = actorName + " đã giao công việc \"" + task.getTitle() + "\" cho bạn trong dự án \"" + projectName + "\".";

        CreateNotificationParams params = CreateNotificationParams.builder()
                .userId(assigneeId)
                .creatorId(actorId)
                .type(NotificationType.TASK_ASSIGNED)
                .priority(NotificationPriority.HIGH)
                .title(title)
                .message(message)
                .entityType("task")
                .entityId(task.getId())
                .actionUrl(actionUrl)
                .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    public void notifyTaskUrgentPriority(Task task, String actorId) {
        if (task == null || task.getId() == null) {
            return;
        }

        List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(task.getId());
        Set<String> recipientUserIds = new LinkedHashSet<>();
        if (assignees != null && !assignees.isEmpty()) {
            for (TaskAssignee assignee : assignees) {
                if (assignee.getUserId() != null && !assignee.getUserId().isBlank()) {
                    recipientUserIds.add(assignee.getUserId());
                }
            }
        } else {
            // Fallback: Nếu công việc chưa phân công ai, thông báo trực tiếp cho người kích hoạt / người tạo
            if (actorId != null && !actorId.isBlank()) {
                recipientUserIds.add(actorId);
            } else if (task.getCreatedBy() != null && !task.getCreatedBy().isBlank()) {
                recipientUserIds.add(task.getCreatedBy());
            }
        }

        if (recipientUserIds.isEmpty()) {
            return;
        }

        Project project = task.getProjectId() != null
                ? projectRepository.findById(task.getProjectId()).orElse(null)
                : null;
        Workspace workspace = project != null && project.getWorkspaceId() != null
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;

        String wsSlug = workspace != null ? workspace.getSlug() : "default";
        String prjSlug = project != null ? project.getSlug() : "default";
        String actionUrl = "/" + wsSlug + "/" + prjSlug + "/tasks/" + task.getId();

        String actorName = actorId != null
                ? userRepository.findById(actorId).map(this::getUserDisplayName).orElse("Thành viên dự án")
                : "Hệ thống";

        String projectName = project != null ? project.getName() : "Dự án";
        String taskTitle = (task.getTitle() != null && !task.getTitle().isBlank()) ? task.getTitle() : "Công việc";
        String title = "🚨 [KHẨN CẤP] Công việc ưu tiên CAO NHẤT: " + taskTitle;
        String message = actorName + " đã đặt mức độ ưu tiên CAO NHẤT cho công việc \"" + taskTitle + "\" thuộc dự án \"" + projectName + "\". Bạn được phân công thực hiện và cần xử lý ngay lập tức!";

        for (String recipientId : recipientUserIds) {
            CreateNotificationParams params = CreateNotificationParams.builder()
                    .userId(recipientId)
                    .creatorId(actorId)
                    .type(NotificationType.SYSTEM)
                    .priority(NotificationPriority.URGENT)
                    .title(title)
                    .message(message)
                    .entityType("task")
                    .entityId(task.getId())
                    .actionUrl(actionUrl)
                    .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                    .build();

            try {
                sendAndBroadcastNotification(params);
            } catch (Exception e) {
                log.warn("Failed to dispatch urgent priority notification to user {}: {}", recipientId, e.getMessage());
            }
        }
    }

    public void notifyMention(Task task, TaskComment comment, String mentionedUserId, String actorId) {
        if (mentionedUserId == null || mentionedUserId.isBlank() || mentionedUserId.equals(actorId)) {
            return;
        }

        Project project = task.getProjectId() != null
                ? projectRepository.findById(task.getProjectId()).orElse(null)
                : null;
        Workspace workspace = project != null && project.getWorkspaceId() != null
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;

        String wsSlug = workspace != null ? workspace.getSlug() : "default";
        String prjSlug = project != null ? project.getSlug() : "default";
        String actionUrl = "/" + wsSlug + "/" + prjSlug + "/tasks/" + task.getId();

        String actorName = actorId != null
                ? userRepository.findById(actorId).map(this::getUserDisplayName).orElse("Thành viên dự án")
                : "Thành viên dự án";

        String contentSnippet = truncateContent(comment.getContent(), 120);
        String title = actorName + " đã nhắc tên bạn trong một bình luận";
        String message = actorName + " đã nhắc đến bạn trong công việc \"" + task.getTitle() + "\": \"" + contentSnippet + "\"";

        CreateNotificationParams params = CreateNotificationParams.builder()
                .userId(mentionedUserId)
                .creatorId(actorId)
                .type(NotificationType.MENTION)
                .priority(NotificationPriority.HIGH)
                .title(title)
                .message(message)
                .entityType("task")
                .entityId(task.getId())
                .actionUrl(actionUrl)
                .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    public void notifyTaskCommented(Task task, TaskComment comment, String recipientUserId, String actorId) {
        if (recipientUserId == null || recipientUserId.isBlank() || recipientUserId.equals(actorId)) {
            return;
        }

        Project project = task.getProjectId() != null
                ? projectRepository.findById(task.getProjectId()).orElse(null)
                : null;
        Workspace workspace = project != null && project.getWorkspaceId() != null
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;

        String wsSlug = workspace != null ? workspace.getSlug() : "default";
        String prjSlug = project != null ? project.getSlug() : "default";
        String actionUrl = "/" + wsSlug + "/" + prjSlug + "/tasks/" + task.getId();

        String actorName = actorId != null
                ? userRepository.findById(actorId).map(this::getUserDisplayName).orElse("Thành viên dự án")
                : "Thành viên dự án";

        String contentSnippet = truncateContent(comment.getContent(), 120);
        String title = "Bình luận mới trong: " + task.getTitle();
        String message = actorName + " đã bình luận trong công việc \"" + task.getTitle() + "\": \"" + contentSnippet + "\"";

        CreateNotificationParams params = CreateNotificationParams.builder()
                .userId(recipientUserId)
                .creatorId(actorId)
                .type(NotificationType.TASK_COMMENTED)
                .priority(NotificationPriority.MEDIUM)
                .title(title)
                .message(message)
                .entityType("task")
                .entityId(task.getId())
                .actionUrl(actionUrl)
                .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    public void notifyTaskStatusChanged(Task task, String oldStatusName, String newStatusName, String actorId) {
        Project project = task.getProjectId() != null
                ? projectRepository.findById(task.getProjectId()).orElse(null)
                : null;
        Workspace workspace = project != null && project.getWorkspaceId() != null
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;

        String wsSlug = workspace != null ? workspace.getSlug() : "default";
        String prjSlug = project != null ? project.getSlug() : "default";
        String actionUrl = "/" + wsSlug + "/" + prjSlug + "/tasks/" + task.getId();

        String actorName = actorId != null
                ? userRepository.findById(actorId).map(this::getUserDisplayName).orElse("Thành viên dự án")
                : "Thành viên dự án";

        String title = "Cập nhật trạng thái: " + task.getTitle();
        String message = actorName + " đã chuyển công việc \"" + task.getTitle() + "\" từ [" + oldStatusName + "] sang [" + newStatusName + "].";

        // 1. Notify Assignees if not actor
        List<String> assigneeIds = taskAssigneeRepository.findByTaskId(task.getId()).stream()
                .map(TaskAssignee::getUserId)
                .toList();

        for (String aId : assigneeIds) {
            if (!aId.equals(actorId)) {
                CreateNotificationParams params = CreateNotificationParams.builder()
                        .userId(aId)
                        .creatorId(actorId)
                        .type(NotificationType.TASK_STATUS_CHANGED)
                        .priority(NotificationPriority.MEDIUM)
                        .title(title)
                        .message(message)
                        .entityType("task")
                        .entityId(task.getId())
                        .actionUrl(actionUrl)
                        .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                        .build();
                sendAndBroadcastNotification(params);
            }
        }

        // 2. Notify Creator if not actor and not assignee
        if (task.getCreatedBy() != null && !task.getCreatedBy().equals(actorId) && !assigneeIds.contains(task.getCreatedBy())) {
            CreateNotificationParams params = CreateNotificationParams.builder()
                    .userId(task.getCreatedBy())
                    .creatorId(actorId)
                    .type(NotificationType.TASK_STATUS_CHANGED)
                    .priority(NotificationPriority.MEDIUM)
                    .title(title)
                    .message(message)
                    .entityType("task")
                    .entityId(task.getId())
                    .actionUrl(actionUrl)
                    .organizationId(workspace != null ? workspace.getOrganizationId() : null)
                    .build();
            sendAndBroadcastNotification(params);
        }
    }

    private String getUserDisplayName(User u) {
        if (u == null) return "Thành viên";
        String name = ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
        if (!name.isBlank()) return name;
        if (u.getUsername() != null && !u.getUsername().isBlank()) return u.getUsername();
        return u.getEmail() != null ? u.getEmail() : "Thành viên";
    }

    private String truncateContent(String text, int maxLen) {
        if (text == null) return "";
        String clean = text.replaceAll("<[^>]*>", "").trim();
        if (clean.length() <= maxLen) return clean;
        return clean.substring(0, maxLen) + "...";
    }
}

package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.notification.AiCatchupResponseDto;
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
import java.util.ArrayList;
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
    private final AiChatService aiChatService;

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
        return getUserNotifications(userId, null, null, null);
    }

    public List<NotificationResponse> getUserNotifications(String userId, String organizationId, String category, Boolean isRead) {
        List<Notification> all;
        if (organizationId != null && !organizationId.isBlank()) {
            if (Boolean.FALSE.equals(isRead)) {
                all = notificationRepository.findByUserIdAndOrganizationIdAndIsReadFalseOrderByCreatedAtDesc(userId, organizationId);
            } else {
                all = notificationRepository.findByUserIdAndOrganizationIdOrderByCreatedAtDesc(userId, organizationId);
            }
        } else {
            if (Boolean.FALSE.equals(isRead)) {
                all = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
            } else {
                all = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            }
        }

        if (isRead != null) {
            all = all.stream().filter(n -> Boolean.valueOf(n.getIsRead()).equals(isRead)).toList();
        }

        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            all = all.stream().filter(n -> matchesCategory(n, category)).toList();
        }

        return all.stream().map(this::buildResponse).toList();
    }

    private boolean matchesCategory(Notification n, String category) {
        if (n == null) return false;
        String cat = category.toLowerCase().trim();
        return switch (cat) {
            case "unread" -> Boolean.FALSE.equals(n.getIsRead());
            case "assigned" -> n.getType() == NotificationType.TASK_ASSIGNED || n.getType() == NotificationType.WORKSPACE_INVITED;
            case "urgent" -> n.getPriority() == NotificationPriority.URGENT || n.getPriority() == NotificationPriority.HIGH || n.getType() == NotificationType.TASK_DUE_SOON;
            case "discussions", "comments" -> n.getType() == NotificationType.TASK_COMMENTED || n.getType() == NotificationType.MENTION;
            case "system" -> n.getType() == NotificationType.PROJECT_CREATED || n.getType() == NotificationType.PROJECT_UPDATED || n.getType() == NotificationType.SYSTEM;
            default -> true;
        };
    }

    public List<NotificationResponse> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public long getUnreadCount(String userId, String organizationId) {
        if (organizationId != null && !organizationId.isBlank()) {
            return notificationRepository.countByUserIdAndOrganizationIdAndIsReadFalse(userId, organizationId);
        }
        return getUnreadCount(userId);
    }

    public AiCatchupResponseDto generateAiCatchup(String userId, String organizationId) {
        List<Notification> unreadList;
        if (organizationId != null && !organizationId.isBlank()) {
            unreadList = notificationRepository.findByUserIdAndOrganizationIdAndIsReadFalseOrderByCreatedAtDesc(userId, organizationId);
        } else {
            unreadList = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        }

        if (unreadList.isEmpty()) {
            if (organizationId != null && !organizationId.isBlank()) {
                unreadList = notificationRepository.findByUserIdAndOrganizationIdOrderByCreatedAtDesc(userId, organizationId)
                        .stream().limit(10).toList();
            } else {
                unreadList = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                        .stream().limit(10).toList();
            }
        }

        if (unreadList.isEmpty()) {
            return AiCatchupResponseDto.builder()
                    .success(true)
                    .unreadCount(0)
                    .urgentCount(0)
                    .summary("Tuyệt vời! Bạn không có thông báo nào chưa đọc lúc này. Tất cả công việc đang trong tầm kiểm soát!")
                    .highlights(List.of("Mọi thông báo đã được xử lý gọn gàng.", "Sẵn sàng cho các đầu việc mới!"))
                    .suggestedActions(List.of())
                    .build();
        }

        int urgentCount = 0;
        List<String> highlights = new ArrayList<>();
        List<AiCatchupResponseDto.SuggestedActionDto> suggestedActions = new ArrayList<>();

        StringBuilder digestContext = new StringBuilder();
        for (int i = 0; i < Math.min(unreadList.size(), 15); i++) {
            Notification n = unreadList.get(i);
            boolean isUrgent = n.getPriority() == NotificationPriority.URGENT || n.getPriority() == NotificationPriority.HIGH || n.getType() == NotificationType.TASK_DUE_SOON;
            if (isUrgent) {
                urgentCount++;
            }
            digestContext.append(String.format("- [%s] %s: %s (Priority: %s)\n",
                    n.getType(), n.getTitle(), n.getMessage(), n.getPriority()));

            if (isUrgent && suggestedActions.stream().noneMatch(a -> "VIEW_URGENT".equals(a.getActionType()))) {
                highlights.add(String.format("⚡ Khẩn cấp: %s", n.getTitle()));
                suggestedActions.add(AiCatchupResponseDto.SuggestedActionDto.builder()
                        .id("act_urgent")
                        .label("Xem việc khẩn cấp")
                        .actionType("VIEW_URGENT")
                        .targetUrl(n.getActionUrl())
                        .entityId(n.getEntityId())
                        .entityType(n.getEntityType())
                        .build());
            } else if (n.getType() == NotificationType.WORKSPACE_INVITED && suggestedActions.stream().noneMatch(a -> "ACCEPT_INVITE".equals(a.getActionType()))) {
                highlights.add(String.format("🚀 Lời mời: %s", n.getTitle()));
                suggestedActions.add(AiCatchupResponseDto.SuggestedActionDto.builder()
                        .id("act_invite")
                        .label("Xử lý lời mời")
                        .actionType("ACCEPT_INVITE")
                        .targetUrl(n.getActionUrl())
                        .entityId(n.getEntityId())
                        .entityType("workspace")
                        .build());
            } else if ((n.getType() == NotificationType.TASK_COMMENTED || n.getType() == NotificationType.MENTION) && highlights.size() < 3) {
                highlights.add(String.format("💬 Thảo luận: %s", n.getTitle()));
            } else if (n.getType() == NotificationType.TASK_ASSIGNED && highlights.size() < 3) {
                highlights.add(String.format("📌 Giao việc: %s", n.getTitle()));
            }
        }

        if (suggestedActions.stream().noneMatch(a -> "MARK_ALL_READ".equals(a.getActionType()))) {
            suggestedActions.add(AiCatchupResponseDto.SuggestedActionDto.builder()
                    .id("act_mark_all")
                    .label("Đánh dấu tất cả đã đọc")
                    .actionType("MARK_ALL_READ")
                    .build());
        }

        String summary = null;
        try {
            String prompt = String.format("""
                Dưới đây là danh sách các thông báo công việc gần đây của người dùng trong hệ thống Taskosaur:
                %s
                
                Hãy viết một tóm tắt siêu ngắn gọn (khoảng 2 câu, tối đa 50 từ) bằng tiếng Việt thật tự nhiên, phong cách chuyên nghiệp, giúp người dùng nắm được ngay điều cần làm nhất hôm nay. Không dùng markdown rườm rà.
                """, digestContext.toString());

            summary = aiChatService.generateCatchupSummary(prompt, userId);
        } catch (Exception e) {
            log.warn("AI generation failed for catchup: {}", e.getMessage());
        }

        if (summary == null || summary.isBlank()) {
            if (urgentCount > 0) {
                summary = String.format("Bạn có %d thông báo chưa đọc, trong đó có %d việc quan trọng cần ưu tiên giải quyết.",
                        unreadList.size(), urgentCount);
            } else {
                summary = String.format("Bạn có %d thông báo mới từ đồng nghiệp và hệ thống. Các công việc đang tiến triển bình thường.",
                        unreadList.size());
            }
        }

        if (highlights.isEmpty()) {
            highlights.add(String.format("Đang có %d cập nhật mới cần bạn xem qua.", unreadList.size()));
        }

        return AiCatchupResponseDto.builder()
                .success(true)
                .unreadCount(unreadList.size())
                .urgentCount(urgentCount)
                .summary(summary.trim())
                .highlights(highlights)
                .suggestedActions(suggestedActions)
                .build();
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

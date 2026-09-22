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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
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
@Transactional
public class NotificationService {

    private static final String NOTIFICATION_NOT_FOUND_MSG = "Notification not found with id: ";
    private static final String TASKS_RESOURCE = "tasks";
    private static final String DEFAULT_SLUG = "default";
    private static final String PROJECT_MEMBER_DEFAULT = "Thành viên dự án";

    private final NotificationRepository notificationRepository;
    private final WebSocketEventService webSocketEventService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final AiChatService aiChatService;

    public NotificationService(
            NotificationRepository notificationRepository,
            WebSocketEventService webSocketEventService,
            EmailService emailService,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            WorkspaceRepository workspaceRepository,
            TaskAssigneeRepository taskAssigneeRepository,
            @Lazy AiChatService aiChatService
    ) {
        this.notificationRepository = notificationRepository;
        this.webSocketEventService = webSocketEventService;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.workspaceRepository = workspaceRepository;
        this.taskAssigneeRepository = taskAssigneeRepository;
        this.aiChatService = aiChatService;
    }

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    private record ProjectContext(Project project, Workspace workspace) {}

    private record CatchupDigestData(
            String digestContext,
            int urgentCount,
            List<String> highlights,
            List<AiCatchupResponseDto.SuggestedActionDto> suggestedActions
    ) {}

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
        List<Notification> all = fetchNotifications(userId, organizationId, isRead);

        if (isRead != null) {
            all = all.stream().filter(n -> isRead.equals(n.getIsRead())).toList();
        }

        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            all = all.stream().filter(n -> matchesCategory(n, category)).toList();
        }

        return all.stream().map(this::buildResponse).toList();
    }

    private List<Notification> fetchNotifications(String userId, String organizationId, Boolean isRead) {
        boolean unreadOnly = Boolean.FALSE.equals(isRead);
        boolean hasOrg = organizationId != null && !organizationId.isBlank();

        if (hasOrg) {
            return unreadOnly
                    ? notificationRepository.findByUserIdAndOrganizationIdAndIsReadFalseOrderByCreatedAtDesc(userId, organizationId)
                    : notificationRepository.findByUserIdAndOrganizationIdOrderByCreatedAtDesc(userId, organizationId);
        }
        return unreadOnly
                ? notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
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
        List<Notification> unreadList = getNotificationsForCatchup(userId, organizationId);
        if (unreadList.isEmpty()) {
            return buildEmptyCatchupResponse();
        }

        CatchupDigestData data = extractCatchupDigestData(unreadList);
        String summary = resolveCatchupSummary(data.digestContext(), data.urgentCount(), unreadList.size(), userId);

        return AiCatchupResponseDto.builder()
                .success(true)
                .unreadCount(unreadList.size())
                .urgentCount(data.urgentCount())
                .summary(summary)
                .highlights(data.highlights())
                .suggestedActions(data.suggestedActions())
                .build();
    }

    private List<Notification> getNotificationsForCatchup(String userId, String organizationId) {
        boolean hasOrg = organizationId != null && !organizationId.isBlank();
        List<Notification> list = hasOrg
                ? notificationRepository.findByUserIdAndOrganizationIdAndIsReadFalseOrderByCreatedAtDesc(userId, organizationId)
                : notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        if (!list.isEmpty()) {
            return list;
        }

        return hasOrg
                ? notificationRepository.findByUserIdAndOrganizationIdOrderByCreatedAtDesc(userId, organizationId).stream().limit(10).toList()
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().limit(10).toList();
    }

    private AiCatchupResponseDto buildEmptyCatchupResponse() {
        return AiCatchupResponseDto.builder()
                .success(true)
                .unreadCount(0)
                .urgentCount(0)
                .summary("Tuyệt vời! Bạn không có thông báo nào chưa đọc lúc này. Tất cả công việc đang trong tầm kiểm soát!")
                .highlights(List.of("Mọi thông báo đã được xử lý gọn gàng.", "Sẵn sàng cho các đầu việc mới!"))
                .suggestedActions(List.of())
                .build();
    }

    private CatchupDigestData extractCatchupDigestData(List<Notification> unreadList) {
        int urgentCount = 0;
        List<String> highlights = new ArrayList<>();
        List<AiCatchupResponseDto.SuggestedActionDto> suggestedActions = new ArrayList<>();
        StringBuilder digestContext = new StringBuilder();

        int limit = Math.min(unreadList.size(), 15);
        for (int i = 0; i < limit; i++) {
            Notification n = unreadList.get(i);
            boolean isUrgent = isUrgentNotification(n);
            if (isUrgent) {
                urgentCount++;
            }
            digestContext.append(String.format("- [%s] %s: %s (Priority: %s)%n",
                    n.getType(), n.getTitle(), n.getMessage(), n.getPriority()));

            collectHighlightAndAction(n, isUrgent, highlights, suggestedActions);
        }

        if (suggestedActions.stream().noneMatch(a -> "MARK_ALL_READ".equals(a.getActionType()))) {
            suggestedActions.add(AiCatchupResponseDto.SuggestedActionDto.builder()
                    .id("act_mark_all")
                    .label("Đánh dấu tất cả đã đọc")
                    .actionType("MARK_ALL_READ")
                    .build());
        }

        if (highlights.isEmpty()) {
            highlights.add(String.format("Đang có %d cập nhật mới cần bạn xem qua.", unreadList.size()));
        }

        return new CatchupDigestData(digestContext.toString(), urgentCount, highlights, suggestedActions);
    }

    private boolean isUrgentNotification(Notification n) {
        return n.getPriority() == NotificationPriority.URGENT
                || n.getPriority() == NotificationPriority.HIGH
                || n.getType() == NotificationType.TASK_DUE_SOON;
    }

    private void collectHighlightAndAction(
            Notification n,
            boolean isUrgent,
            List<String> highlights,
            List<AiCatchupResponseDto.SuggestedActionDto> suggestedActions
    ) {
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

    private String resolveCatchupSummary(String digestContext, int urgentCount, int totalCount, String userId) {
        String summary = null;
        try {
            String prompt = String.format("""
                Dưới đây là danh sách các thông báo công việc gần đây của người dùng trong hệ thống Taskosaur:
                %s
                
                Hãy viết một tóm tắt siêu ngắn gọn (khoảng 2 câu, tối đa 50 từ) bằng tiếng Việt thật tự nhiên, phong cách chuyên nghiệp, giúp người dùng nắm được ngay điều cần làm nhất hôm nay. Không dùng markdown rườm rà.
                """, digestContext);

            summary = aiChatService.generateCatchupSummary(prompt, userId);
        } catch (Exception e) {
            log.warn("AI generation failed for catchup: {}", e.getMessage());
        }

        if (summary == null || summary.isBlank()) {
            return urgentCount > 0
                    ? String.format("Bạn có %d thông báo chưa đọc, trong đó có %d việc quan trọng cần ưu tiên giải quyết.", totalCount, urgentCount)
                    : String.format("Bạn có %d thông báo mới từ đồng nghiệp và hệ thống. Các công việc đang tiến triển bình thường.", totalCount);
        }
        return summary.trim();
    }

    public void markAsRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(NOTIFICATION_NOT_FOUND_MSG + id));

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
                .orElseThrow(() -> new ResourceNotFoundException(NOTIFICATION_NOT_FOUND_MSG + id));
        if (userId != null && !n.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot view another user's notification");
        }
        return buildResponse(n);
    }

    public void deleteNotification(String id, String userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(NOTIFICATION_NOT_FOUND_MSG + id));
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

                String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl : "";
                String actionUrl = params.getActionUrl() != null ? params.getActionUrl() : "";
                if (!actionUrl.startsWith("http") && !baseUrl.isEmpty()) {
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

    private ProjectContext resolveProjectContext(String projectId) {
        Project project = projectId != null ? projectRepository.findById(projectId).orElse(null) : null;
        Workspace workspace = (project != null && project.getWorkspaceId() != null)
                ? workspaceRepository.findById(project.getWorkspaceId()).orElse(null)
                : null;
        return new ProjectContext(project, workspace);
    }

    private String buildTaskActionUrl(Workspace workspace, Project project, String taskId) {
        String wsSlug = workspace != null ? workspace.getSlug() : DEFAULT_SLUG;
        String prjSlug = project != null ? project.getSlug() : DEFAULT_SLUG;
        return String.join("/", "", wsSlug, prjSlug, TASKS_RESOURCE, taskId);
    }

    private String getActorDisplayName(String actorId, String fallback) {
        if (actorId == null || actorId.isBlank()) {
            return fallback;
        }
        return userRepository.findById(actorId).map(this::getUserDisplayName).orElse(fallback);
    }

    public void notifyTaskAssigned(Task task, String assigneeId, String actorId) {
        if (assigneeId == null || assigneeId.isBlank() || assigneeId.equals(actorId)) {
            return;
        }

        ProjectContext ctx = resolveProjectContext(task.getProjectId());
        String actionUrl = buildTaskActionUrl(ctx.workspace(), ctx.project(), task.getId());
        String actorName = getActorDisplayName(actorId, PROJECT_MEMBER_DEFAULT);

        String projectName = ctx.project() != null ? ctx.project().getName() : "Dự án";
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
                .organizationId(ctx.workspace() != null ? ctx.workspace().getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    private Set<String> resolveUrgentRecipients(Task task, String actorId) {
        List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(task.getId());
        Set<String> recipientUserIds = new LinkedHashSet<>();
        if (assignees != null && !assignees.isEmpty()) {
            for (TaskAssignee assignee : assignees) {
                if (assignee.getUserId() != null && !assignee.getUserId().isBlank()) {
                    recipientUserIds.add(assignee.getUserId());
                }
            }
        } else if (actorId != null && !actorId.isBlank()) {
            recipientUserIds.add(actorId);
        } else if (task.getCreatedBy() != null && !task.getCreatedBy().isBlank()) {
            recipientUserIds.add(task.getCreatedBy());
        }
        return recipientUserIds;
    }

    public void notifyTaskUrgentPriority(Task task, String actorId) {
        if (task == null || task.getId() == null) {
            return;
        }

        Set<String> recipientUserIds = resolveUrgentRecipients(task, actorId);
        if (recipientUserIds.isEmpty()) {
            return;
        }

        ProjectContext ctx = resolveProjectContext(task.getProjectId());
        String actionUrl = buildTaskActionUrl(ctx.workspace(), ctx.project(), task.getId());
        String actorName = getActorDisplayName(actorId, "Hệ thống");

        String projectName = ctx.project() != null ? ctx.project().getName() : "Dự án";
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
                    .organizationId(ctx.workspace() != null ? ctx.workspace().getOrganizationId() : null)
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

        ProjectContext ctx = resolveProjectContext(task.getProjectId());
        String actionUrl = buildTaskActionUrl(ctx.workspace(), ctx.project(), task.getId());
        String actorName = getActorDisplayName(actorId, PROJECT_MEMBER_DEFAULT);

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
                .organizationId(ctx.workspace() != null ? ctx.workspace().getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    public void notifyTaskCommented(Task task, TaskComment comment, String recipientUserId, String actorId) {
        if (recipientUserId == null || recipientUserId.isBlank() || recipientUserId.equals(actorId)) {
            return;
        }

        ProjectContext ctx = resolveProjectContext(task.getProjectId());
        String actionUrl = buildTaskActionUrl(ctx.workspace(), ctx.project(), task.getId());
        String actorName = getActorDisplayName(actorId, PROJECT_MEMBER_DEFAULT);

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
                .organizationId(ctx.workspace() != null ? ctx.workspace().getOrganizationId() : null)
                .build();

        sendAndBroadcastNotification(params);
    }

    public void notifyTaskStatusChanged(Task task, String oldStatusName, String newStatusName, String actorId) {
        ProjectContext ctx = resolveProjectContext(task.getProjectId());
        String actionUrl = buildTaskActionUrl(ctx.workspace(), ctx.project(), task.getId());
        String actorName = getActorDisplayName(actorId, PROJECT_MEMBER_DEFAULT);

        String title = "Cập nhật trạng thái: " + task.getTitle();
        String message = actorName + " đã chuyển công việc \"" + task.getTitle() + "\" từ [" + oldStatusName + "] sang [" + newStatusName + "].";

        List<String> assigneeIds = taskAssigneeRepository.findByTaskId(task.getId()).stream()
                .map(TaskAssignee::getUserId)
                .toList();

        Set<String> recipientIds = new LinkedHashSet<>();
        for (String aId : assigneeIds) {
            if (!aId.equals(actorId)) {
                recipientIds.add(aId);
            }
        }
        if (task.getCreatedBy() != null && !task.getCreatedBy().equals(actorId)) {
            recipientIds.add(task.getCreatedBy());
        }

        for (String recipientId : recipientIds) {
            CreateNotificationParams params = CreateNotificationParams.builder()
                    .userId(recipientId)
                    .creatorId(actorId)
                    .type(NotificationType.TASK_STATUS_CHANGED)
                    .priority(NotificationPriority.MEDIUM)
                    .title(title)
                    .message(message)
                    .entityType("task")
                    .entityId(task.getId())
                    .actionUrl(actionUrl)
                    .organizationId(ctx.workspace() != null ? ctx.workspace().getOrganizationId() : null)
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

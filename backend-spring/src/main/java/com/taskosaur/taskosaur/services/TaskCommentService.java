package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.CreateTaskCommentRequest;
import com.taskosaur.taskosaur.dto.task.TaskCommentResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskComment;
import com.taskosaur.taskosaur.models.ProjectMember;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.ProjectMemberRepository;
import com.taskosaur.taskosaur.repositories.TaskCommentRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TaskCommentService {

    private static final String TASK_NOT_FOUND_MSG = "Task not found with id: ";
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WebSocketEventService webSocketEventService;
    private final NotificationService notificationService;
    private final ProjectMemberRepository projectMemberRepository;
    private final com.taskosaur.taskosaur.repositories.TaskAssigneeRepository taskAssigneeRepository;

    @com.taskosaur.taskosaur.annotations.Auditable(action = com.taskosaur.taskosaur.enums.ActivityType.TASK_COMMENTED, entityType = "TASK")
    public TaskCommentResponse createComment(String taskIdOrSlug, CreateTaskCommentRequest request, String userId) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);

        TaskComment comment = TaskComment.builder()
                .content(request.getContent().trim())
                .taskId(effectiveTaskId)
                .authorId(userId)
                .parentCommentId(request.getParentCommentId())
                .createdBy(userId)
                .build();

        TaskComment savedComment = taskCommentRepository.save(comment);
        TaskCommentResponse response = buildResponse(savedComment);
        try {
            taskRepository.findById(effectiveTaskId).ifPresent(t -> {
                // 1. Broadcast comment qua WebSocket tới room dự án & task
                webSocketEventService.notifyCommentAdded(t.getProjectId(), effectiveTaskId, response);

                // 2. Tìm kiếm và gửi thông báo cho người được @Mention
                Set<String> mentionedUserIds = extractMentionedUserIds(request.getContent(), t.getProjectId());
                for (String mUserId : mentionedUserIds) {
                    if (mUserId != null && !mUserId.equals(userId)) {
                        notificationService.notifyMention(t, savedComment, mUserId, userId);
                    }
                }

                // 3. Gửi thông báo cho tất cả Assignees của task (nếu khác tác giả comment và chưa được mention)
                List<String> assigneeIds = taskAssigneeRepository.findByTaskId(effectiveTaskId).stream()
                        .map(com.taskosaur.taskosaur.models.TaskAssignee::getUserId)
                        .toList();
                for (String aId : assigneeIds) {
                    if (!aId.equals(userId) && !mentionedUserIds.contains(aId)) {
                        notificationService.notifyTaskCommented(t, savedComment, aId, userId);
                    }
                }

                // 4. Gửi thông báo cho Creator của task (nếu khác tác giả, khác assignee và chưa được mention)
                if (t.getCreatedBy() != null
                        && !t.getCreatedBy().equals(userId)
                        && !assigneeIds.contains(t.getCreatedBy())
                        && !mentionedUserIds.contains(t.getCreatedBy())) {
                    notificationService.notifyTaskCommented(t, savedComment, t.getCreatedBy(), userId);
                }
            });
        } catch (Exception e) {
            log.warn("Failed to dispatch comment/mention notifications: {}", e.getMessage());
        }
        return response;
    }

    private Set<String> extractMentionedUserIds(String content, String projectId) {
        Set<String> userIds = new HashSet<>();
        if (content == null || content.isBlank()) return userIds;

        // 1. Thẻ Tiptap HTML: data-id="<uuid>"
        Pattern dataIdPattern = Pattern.compile("data-id=\"([^\"]+)\"");
        Matcher m1 = dataIdPattern.matcher(content);
        while (m1.find()) {
            userIds.add(m1.group(1));
        }

        // 2. Lấy danh sách thành viên dự án để đối soát tên/username
        List<ProjectMember> projectMembers = (projectId != null)
                ? projectMemberRepository.findByProjectId(projectId)
                : List.of();
        List<User> memberUsers = projectMembers.stream()
                .map(pm -> userRepository.findById(pm.getUserId()).orElse(null))
                .filter(u -> u != null)
                .toList();

        // 3. Regex dạng @tên hoặc @email
        Pattern mentionPattern = Pattern.compile("@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+|[a-zA-Z0-9._-]+)");
        Matcher m2 = mentionPattern.matcher(content);
        while (m2.find()) {
            String token = m2.group(1).trim();
            if (token.isBlank()) continue;

            // Khớp chính xác email hoặc username trong hệ thống
            userRepository.findByEmail(token).ifPresent(u -> userIds.add(u.getId()));
            userRepository.findByUsername(token).ifPresent(u -> userIds.add(u.getId()));

            // Khớp với firstName / lastName / username của thành viên dự án
            for (User u : memberUsers) {
                if (token.equalsIgnoreCase(u.getFirstName())
                        || token.equalsIgnoreCase(u.getLastName())
                        || token.equalsIgnoreCase(u.getUsername())
                        || (u.getEmail() != null && token.equalsIgnoreCase(u.getEmail().split("@")[0]))) {
                    userIds.add(u.getId());
                }
            }
        }

        return userIds;
    }

    public List<TaskCommentResponse> getCommentsByTask(String taskIdOrSlug) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(effectiveTaskId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public Map<String, Object> getPagedCommentsByTask(String taskIdOrSlug, int page, int limit, String sort) {
        List<TaskCommentResponse> all = getCommentsByTask(taskIdOrSlug);
        if ("desc".equalsIgnoreCase(sort)) {
            all = all.reversed();
        }
        int total = all.size();
        int totalPages = total > 0 ? (int) Math.ceil((double) total / limit) : 0;
        int skip = (page - 1) * limit;
        List<TaskCommentResponse> data = all.stream()
                .skip(Math.max(0, skip))
                .limit(limit)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("data", data);
        result.put("total", total);
        result.put("page", page);
        result.put("limit", limit);
        result.put("totalPages", totalPages);
        result.put("hasMore", page < totalPages);
        result.put("loadedCount", data.size());
        return result;
    }

    public TaskCommentResponse updateComment(String id, String content, String userId) {
        TaskComment comment = taskCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        if (!comment.getAuthorId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to update this comment");
        }

        comment.setContent(content.trim());
        comment.setUpdatedBy(userId);
        TaskComment updated = taskCommentRepository.save(comment);
        return buildResponse(updated);
    }

    public void deleteComment(String id, String userId) {
        TaskComment comment = taskCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        if (!comment.getAuthorId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to delete this comment");
        }

        taskCommentRepository.delete(comment);
    }

    private String resolveTaskId(String taskIdOrSlug) {
        if (taskIdOrSlug == null || taskIdOrSlug.isBlank()) {
            throw new ResourceNotFoundException(TASK_NOT_FOUND_MSG + taskIdOrSlug);
        }
        if (UUID_PATTERN.matcher(taskIdOrSlug).matches()) {
            return taskRepository.findById(taskIdOrSlug)
                    .map(Task::getId)
                    .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + taskIdOrSlug));
        }
        return taskRepository.findBySlug(taskIdOrSlug)
                .map(Task::getId)
                .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + taskIdOrSlug));
    }

    private TaskCommentResponse buildResponse(TaskComment comment) {
        TaskCommentResponse.AuthorDto authorDto = null;
        var userOpt = userRepository.findById(comment.getAuthorId());
        if (userOpt.isPresent()) {
            var u = userOpt.get();
            authorDto = TaskCommentResponse.AuthorDto.builder()
                    .id(u.getId())
                    .email(u.getEmail())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .avatar(u.getAvatar())
                    .build();
        }

        return TaskCommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .taskId(comment.getTaskId())
                .authorId(comment.getAuthorId())
                .parentCommentId(comment.getParentCommentId())
                .author(authorDto)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}

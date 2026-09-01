package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.CreateTaskCommentRequest;
import com.taskosaur.taskosaur.dto.task.TaskCommentResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskComment;
import com.taskosaur.taskosaur.repositories.TaskCommentRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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
        return buildResponse(savedComment);
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

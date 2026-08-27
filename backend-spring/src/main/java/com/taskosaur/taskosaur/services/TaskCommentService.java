package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.CreateTaskCommentRequest;
import com.taskosaur.taskosaur.dto.task.TaskCommentResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.TaskComment;
import com.taskosaur.taskosaur.repositories.TaskCommentRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskCommentService {

    private static final String TASK_NOT_FOUND_MSG = "Task not found with id: ";

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskCommentResponse createComment(String taskId, CreateTaskCommentRequest request, String userId) {
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + taskId));

        TaskComment comment = TaskComment.builder()
                .content(request.getContent().trim())
                .taskId(taskId)
                .authorId(userId)
                .parentCommentId(request.getParentCommentId())
                .createdBy(userId)
                .build();

        TaskComment savedComment = taskCommentRepository.save(comment);
        return buildResponse(savedComment);
    }

    public List<TaskCommentResponse> getCommentsByTask(String taskId) {
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(TASK_NOT_FOUND_MSG + taskId));
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public void deleteComment(String id, String userId) {
        TaskComment comment = taskCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        if (!comment.getAuthorId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to delete this comment");
        }

        taskCommentRepository.delete(comment);
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

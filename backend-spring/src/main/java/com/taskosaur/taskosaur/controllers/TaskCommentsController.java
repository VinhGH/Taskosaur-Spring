package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.task.CreateTaskCommentRequest;
import com.taskosaur.taskosaur.dto.task.TaskCommentResponse;
import com.taskosaur.taskosaur.services.TaskCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/task-comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskCommentsController {

    private final TaskCommentService taskCommentService;

    @PostMapping
    public ResponseEntity<TaskCommentResponse> create(
            @Valid @RequestBody CreateTaskCommentRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskCommentResponse created = taskCommentService.createComment(request.getTaskId(), request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getComments(
            @RequestParam(name = "taskId") String taskId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "sort", defaultValue = "desc") String sort
    ) {
        return ResponseEntity.ok(taskCommentService.getPagedCommentsByTask(taskId, page, limit, sort));
    }

    @GetMapping("/middle-pagination")
    public ResponseEntity<Map<String, Object>> getMiddlePagedComments(
            @RequestParam(name = "taskId") String taskId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "sort", defaultValue = "desc") String sort
    ) {
        return ResponseEntity.ok(taskCommentService.getPagedCommentsByTask(taskId, page, limit, sort));
    }

    @PatchMapping("/{commentId}")
    public ResponseEntity<TaskCommentResponse> update(
            @PathVariable String commentId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        String content = body.getOrDefault("content", "");
        TaskCommentResponse updated = taskCommentService.updateComment(commentId, content, currentUserId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable String commentId,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        taskCommentService.deleteComment(commentId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}

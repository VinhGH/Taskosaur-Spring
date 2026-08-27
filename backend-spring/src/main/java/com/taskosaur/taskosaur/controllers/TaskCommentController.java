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

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskCommentController {

    private final TaskCommentService taskCommentService;

    @PostMapping
    public ResponseEntity<TaskCommentResponse> create(
            @PathVariable String taskId,
            @Valid @RequestBody CreateTaskCommentRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskCommentResponse created = taskCommentService.createComment(taskId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TaskCommentResponse>> getComments(@PathVariable String taskId) {
        return ResponseEntity.ok(taskCommentService.getCommentsByTask(taskId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable String taskId,
            @PathVariable String commentId,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        taskCommentService.deleteComment(commentId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}

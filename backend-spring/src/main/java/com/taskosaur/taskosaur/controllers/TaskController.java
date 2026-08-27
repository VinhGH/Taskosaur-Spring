package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.task.CreateTaskRequest;
import com.taskosaur.taskosaur.dto.task.TaskResponse;
import com.taskosaur.taskosaur.dto.task.UpdateTaskStatusRequest;
import com.taskosaur.taskosaur.services.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskResponse created = taskService.createTask(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(name = "projectId", required = false) String projectId
    ) {
        if (projectId != null && !projectId.isBlank()) {
            return ResponseEntity.ok(taskService.getTasksByProject(projectId));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<TaskResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(taskService.getTaskBySlug(slug));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskResponse updated = taskService.updateTaskStatus(id, request.getStatusId(), currentUserId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}

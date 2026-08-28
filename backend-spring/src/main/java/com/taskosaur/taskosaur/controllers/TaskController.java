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
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskController {

    private static final String KEY_DATA = "data";
    private static final String KEY_TOTAL = "total";
    private static final String KEY_PAGE = "page";
    private static final String KEY_LIMIT = "limit";
    private static final String KEY_TOTAL_PAGES = "totalPages";

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
    public ResponseEntity<Map<String, Object>> getTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        if (projectId != null && !projectId.isBlank()) {
            List<TaskResponse> list = taskService.getTasksByProject(projectId);
            return ResponseEntity.ok(Map.of(
                    KEY_DATA, list,
                    KEY_TOTAL, list.size(),
                    KEY_PAGE, page,
                    KEY_LIMIT, limit,
                    KEY_TOTAL_PAGES, 1
            ));
        }
        return ResponseEntity.ok(Map.of(
                KEY_DATA, List.of(),
                KEY_TOTAL, 0,
                KEY_PAGE, page,
                KEY_LIMIT, limit,
                KEY_TOTAL_PAGES, 1
        ));
    }

    @GetMapping("/calendar")
    public ResponseEntity<Map<String, Object>> getCalendarTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(Map.of(
                KEY_DATA, List.of(),
                KEY_TOTAL, 0,
                KEY_PAGE, page,
                KEY_LIMIT, limit,
                KEY_TOTAL_PAGES, 1
        ));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(Map.of(
                "tasks", List.of(),
                KEY_TOTAL, 0,
                KEY_PAGE, page,
                KEY_LIMIT, limit,
                KEY_TOTAL_PAGES, 1
        ));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<TaskResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(taskService.getTaskBySlug(slug));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
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

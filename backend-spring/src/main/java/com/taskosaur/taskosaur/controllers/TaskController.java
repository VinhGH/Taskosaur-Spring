package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.task.*;
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

    private final TaskService taskService;

    // ─── POST /api/tasks ───────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskResponse created = taskService.createTask(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─── GET /api/tasks/all-tasks ──────────────────────────────────────────────
    @GetMapping("/all-tasks")
    public ResponseEntity<Map<String, Object>> getAllTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "sprintId", required = false) String sprintId,
            @RequestParam(name = "parentTaskId", required = false) String parentTaskId,
            @RequestParam(name = "priorities", required = false) String priorities,
            @RequestParam(name = "statuses", required = false) String statuses,
            @RequestParam(name = "types", required = false) String types,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortOrder", required = false) String sortOrder,
            @RequestParam(name = "from", required = false) String from,
            @RequestParam(name = "to", required = false) String to,
            @RequestParam(name = "dateField", required = false) String dateField,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        TaskFilterQuery query = TaskFilterQuery.builder()
                .organizationId(organizationId)
                .workspaceId(workspaceId)
                .projectId(projectId)
                .sprintId(sprintId)
                .parentTaskId(parentTaskId)
                .priorities(priorities)
                .statuses(statuses)
                .types(types)
                .search(search)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .from(from)
                .to(to)
                .dateField(dateField)
                .page(page)
                .limit(limit)
                .build();
        return ResponseEntity.ok(taskService.getFilteredTasks(query));
    }

    // ─── GET /api/tasks/grouped ────────────────────────────────────────────────
    @GetMapping("/grouped")
    public ResponseEntity<Map<String, Object>> getGroupedTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "groupBy", defaultValue = "status") String groupBy,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "sprintId", required = false) String sprintId,
            @RequestParam(name = "priorities", required = false) String priorities,
            @RequestParam(name = "statuses", required = false) String statuses,
            @RequestParam(name = "types", required = false) String types,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "limitPerGroup", defaultValue = "20") int limitPerGroup,
            @RequestParam(name = "page", defaultValue = "1") int page
    ) {
        TaskGroupQuery groupQuery = TaskGroupQuery.builder()
                .organizationId(organizationId)
                .groupBy(groupBy)
                .workspaceId(workspaceId)
                .projectId(projectId)
                .sprintId(sprintId)
                .priorities(priorities)
                .statuses(statuses)
                .types(types)
                .search(search)
                .limitPerGroup(limitPerGroup)
                .page(page)
                .build();
        return ResponseEntity.ok(taskService.getGroupedTasks(groupQuery));
    }

    // ─── GET /api/tasks/by-status ──────────────────────────────────────────────
    @GetMapping("/by-status")
    public ResponseEntity<Map<String, Object>> getTasksByStatus(
            @RequestParam(name = "slug", required = false) String slug,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "statusId", required = false) String statusId,
            @RequestParam(name = "sprintId", required = false) String sprintId,
            @RequestParam(name = "includeSubtasks", required = false, defaultValue = "false") boolean includeSubtasks,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "25") int limit
    ) {
        return ResponseEntity.ok(taskService.getTasksGroupedByStatus(
                slug, projectId, statusId, sprintId, includeSubtasks, page, limit
        ));
    }

    // ─── GET /api/tasks/calendar ───────────────────────────────────────────────
    @GetMapping("/calendar")
    public ResponseEntity<Map<String, Object>> getCalendarTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        TaskFilterQuery query = TaskFilterQuery.builder()
                .organizationId(organizationId)
                .workspaceId(workspaceId)
                .projectId(projectId)
                .sortBy("dueDate")
                .sortOrder("asc")
                .page(page)
                .limit(limit)
                .build();
        return ResponseEntity.ok(taskService.getFilteredTasks(query));
    }

    // ─── GET /api/tasks/today ──────────────────────────────────────────────────
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        TaskFilterQuery query = TaskFilterQuery.builder()
                .organizationId(organizationId)
                .page(page)
                .limit(limit)
                .build();
        return ResponseEntity.ok(taskService.getFilteredTasks(query));
    }

    // ─── GET /api/tasks/slug/{slug} ────────────────────────────────────
    @GetMapping("/slug/{slug}")
    public ResponseEntity<TaskResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(taskService.getTaskBySlug(slug));
    }

    // ─── GET /api/tasks/key/{key} ──────────────────────────────────────
    @GetMapping("/key/{key}")
    public ResponseEntity<TaskResponse> getByKey(@PathVariable String key) {
        return ResponseEntity.ok(taskService.getTaskBySlug(key));
    }

    // ─── GET /api/tasks (root query) ───────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTasks(
            @RequestParam(name = "organizationId", required = false) String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "sprintId", required = false) String sprintId,
            @RequestParam(name = "parentTaskId", required = false) String parentTaskId,
            @RequestParam(name = "priorities", required = false) String priorities,
            @RequestParam(name = "statuses", required = false) String statuses,
            @RequestParam(name = "types", required = false) String types,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortOrder", required = false) String sortOrder,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        TaskFilterQuery query = TaskFilterQuery.builder()
                .organizationId(organizationId)
                .workspaceId(workspaceId)
                .projectId(projectId)
                .sprintId(sprintId)
                .parentTaskId(parentTaskId)
                .priorities(priorities)
                .statuses(statuses)
                .types(types)
                .search(search)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .page(page)
                .limit(limit)
                .build();
        return ResponseEntity.ok(taskService.getFilteredTasks(query));
    }

    // ─── GET /api/tasks/{id} ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    // ─── PATCH /api/tasks/{id} ─────────────────────────────────────────────────
    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable String id,
            @RequestBody UpdateTaskRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskResponse updated = taskService.updateTask(id, request, currentUserId);
        return ResponseEntity.ok(updated);
    }

    // ─── PATCH /api/tasks/{id}/status ──────────────────────────────────────────
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

    // ─── PATCH /api/tasks/reorder/bulk ─────────────────────────────────────────
    @PatchMapping("/reorder/bulk")
    public ResponseEntity<List<Map<String, Object>>> reorderBulk(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(List.of());
    }

    // ─── PATCH /api/tasks/reorder-list-rank/bulk ──────────────────────────────
    @PatchMapping("/reorder-list-rank/bulk")
    public ResponseEntity<List<Map<String, Object>>> reorderListRankBulk(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(List.of());
    }

    // ─── POST /api/tasks/bulk-create ──────────────────────────────────────────
    @PostMapping("/bulk-create")
    public ResponseEntity<Map<String, Object>> bulkCreate(
            @Valid @RequestBody BulkCreateTasksRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.bulkCreateTasks(request, currentUserId));
    }

    // ─── POST & DELETE /api/tasks/bulk-delete ───────────────────────────────────
    @PostMapping({"/bulk-delete", "/bulk-delete-tasks"})
    public ResponseEntity<Map<String, Object>> bulkDeletePost(@RequestBody BulkDeleteTasksRequest request) {
        return ResponseEntity.ok(taskService.bulkDeleteTasks(request));
    }

    @DeleteMapping({"/bulk-delete", "/bulk-delete-tasks"})
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody BulkDeleteTasksRequest request) {
        return bulkDeletePost(request);
    }

    // ─── POST /api/tasks/bulk-status-update ────────────────────────────────────
    @PostMapping("/bulk-status-update")
    public ResponseEntity<Map<String, Object>> bulkUpdateStatus(
            @RequestBody BulkUpdateTaskStatusRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.bulkUpdateTasksStatus(request, currentUserId));
    }

    // ─── POST /api/tasks/bulk-assign ───────────────────────────────────────────
    @PostMapping("/bulk-assign")
    public ResponseEntity<Map<String, Object>> bulkAssign(
            @RequestBody BulkAssignTasksRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.bulkAssignTasks(request, currentUserId));
    }

    // ─── PATCH /api/tasks/{id}/assignees ────────────────────────────────────────
    @PatchMapping("/{id}/assignees")
    public ResponseEntity<TaskResponse> assignAssignees(
            @PathVariable String id,
            @RequestBody AssignTaskAssigneesRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        List<String> ids = request != null ? request.getAssigneeIds() : List.of();
        TaskResponse response = taskService.assignTaskAssignees(id, ids, currentUserId);
        return ResponseEntity.ok(response);
    }

    // ─── POST /api/tasks/{id}/recurrence ───────────────────────────────────────
    @PostMapping("/{id}/recurrence")
    public ResponseEntity<TaskResponse> addRecurrence(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.addRecurrence(id, body, currentUserId));
    }

    // ─── PATCH /api/tasks/{id}/recurrence ──────────────────────────────────────
    @PatchMapping("/{id}/recurrence")
    public ResponseEntity<TaskResponse> updateRecurrence(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.updateRecurrence(id, body, currentUserId));
    }

    // ─── DELETE /api/tasks/{id}/recurrence ─────────────────────────────────────
    @DeleteMapping("/{id}/recurrence")
    public ResponseEntity<TaskResponse> stopRecurrence(
            @PathVariable String id,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.stopRecurrence(id, currentUserId));
    }

    // ─── POST /api/tasks/{id}/complete-occurrence ──────────────────────────────
    @PostMapping("/{id}/complete-occurrence")
    public ResponseEntity<TaskResponse> completeOccurrence(
            @PathVariable String id,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(taskService.completeOccurrence(id, currentUserId));
    }

    // ─── DELETE /api/tasks/{id} ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}

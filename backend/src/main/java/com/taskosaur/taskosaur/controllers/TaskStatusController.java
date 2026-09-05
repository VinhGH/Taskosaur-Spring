package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.taskstatus.CreateTaskStatusFromProjectRequest;
import com.taskosaur.taskosaur.dto.taskstatus.CreateTaskStatusRequest;
import com.taskosaur.taskosaur.dto.taskstatus.UpdatePositionsRequest;
import com.taskosaur.taskosaur.dto.taskstatus.UpdateTaskStatusRequest;
import com.taskosaur.taskosaur.enums.StatusCategory;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import com.taskosaur.taskosaur.services.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task-statuses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskStatusController {

    private final TaskStatusRepository taskStatusRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowService workflowService;

    /**
     * GET /api/task-statuses/project?projectId={projectId}
     * Frontend gọi endpoint này khi mở Kanban Board để lấy danh sách cột trạng thái.
     */
    @GetMapping("/project")
    public ResponseEntity<List<TaskStatus>> getStatusesByProject(
            @RequestParam(name = "projectId") String projectId
    ) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId());
        return ResponseEntity.ok(statuses);
    }

    /**
     * GET /api/task-statuses?workflowId={workflowId}&organizationId={organizationId}
     * Lấy danh sách trạng thái theo workflow hoặc tất cả.
     */
    @GetMapping
    public ResponseEntity<List<TaskStatus>> getStatuses(
            @RequestParam(name = "workflowId", required = false) String workflowId,
            @RequestParam(name = "organizationId", required = false) String organizationId
    ) {
        if (workflowId != null && !workflowId.isBlank()) {
            return ResponseEntity.ok(taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId));
        }
        return ResponseEntity.ok(taskStatusRepository.findAll());
    }

    /**
     * GET /api/task-statuses/{id}
     * Lấy thông tin chi tiết 1 trạng thái.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskStatus> getById(@PathVariable String id) {
        TaskStatus status = taskStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task status not found with id: " + id));
        return ResponseEntity.ok(status);
    }

    /**
     * POST /api/task-statuses
     * Tạo mới cột trạng thái
     */
    @PostMapping
    public ResponseEntity<TaskStatus> createStatus(@Valid @RequestBody CreateTaskStatusRequest request) {
        String workflowId = request.getWorkflowId();
        if ((workflowId == null || workflowId.isBlank()) && request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));
            workflowId = project.getWorkflowId();
        }
        if (workflowId == null || workflowId.isBlank()) {
            throw new ResourceNotFoundException("Workflow ID is required to create a task status");
        }

        int nextPosition = request.getPosition() != null ? request.getPosition() :
                taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId).size();

        TaskStatus status = TaskStatus.builder()
                .name(request.getName().trim())
                .color(request.getColor() != null ? request.getColor() : "#6B7280")
                .category(request.getCategory() != null ? request.getCategory() : StatusCategory.TODO)
                .position(nextPosition)
                .workflowId(workflowId)
                .build();

        return ResponseEntity.ok(taskStatusRepository.save(status));
    }

    /**
     * POST /api/task-statuses/from-project
     * Tạo cột trạng thái gắn liền với 1 project
     */
    @PostMapping("/from-project")
    public ResponseEntity<TaskStatus> createStatusFromProject(@Valid @RequestBody CreateTaskStatusFromProjectRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        int nextPosition = request.getPosition() != null ? request.getPosition() :
                taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId()).size();

        TaskStatus status = TaskStatus.builder()
                .name(request.getName().trim())
                .color(request.getColor() != null ? request.getColor() : "#6B7280")
                .category(request.getCategory() != null ? request.getCategory() : StatusCategory.TODO)
                .position(nextPosition)
                .workflowId(project.getWorkflowId())
                .build();

        return ResponseEntity.ok(taskStatusRepository.save(status));
    }

    /**
     * PATCH /api/task-statuses/{id}
     * Cập nhật thông tin cột trạng thái
     */
    @PatchMapping("/{id}")
    public ResponseEntity<TaskStatus> updateStatus(
            @PathVariable String id,
            @RequestBody UpdateTaskStatusRequest request
    ) {
        TaskStatus status = taskStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task status not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            status.setName(request.getName().trim());
        }
        if (request.getColor() != null) {
            status.setColor(request.getColor());
        }
        if (request.getCategory() != null) {
            status.setCategory(request.getCategory());
        }
        if (request.getPosition() != null) {
            status.setPosition(request.getPosition());
        }

        return ResponseEntity.ok(taskStatusRepository.save(status));
    }

    /**
     * PATCH /api/task-statuses/positions
     * Cập nhật thứ tự sắp xếp các cột trạng thái
     */
    @PatchMapping("/positions")
    public ResponseEntity<List<TaskStatus>> updatePositions(@RequestBody UpdatePositionsRequest request) {
        if (request != null && request.getStatusUpdates() != null) {
            for (UpdatePositionsRequest.PositionUpdateItem item : request.getStatusUpdates()) {
                if (item.getId() != null && item.getPosition() != null) {
                    taskStatusRepository.findById(item.getId()).ifPresent(status -> {
                        status.setPosition(item.getPosition());
                        taskStatusRepository.save(status);
                    });
                }
            }
        }
        return ResponseEntity.ok(taskStatusRepository.findAll());
    }

    /**
     * DELETE /api/task-statuses/{id}
     * Xóa cột trạng thái
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteStatus(@PathVariable String id) {
        TaskStatus status = taskStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task status not found with id: " + id));
        taskStatusRepository.delete(status);
        return ResponseEntity.ok(Map.of("success", true, "message", "Task status deleted successfully"));
    }
}

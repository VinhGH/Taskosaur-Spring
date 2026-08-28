package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import com.taskosaur.taskosaur.services.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}

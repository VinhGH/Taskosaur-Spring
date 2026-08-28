package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.dto.sprint.SprintResponse;
import com.taskosaur.taskosaur.dto.task.TaskResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import com.taskosaur.taskosaur.services.ProjectService;
import com.taskosaur.taskosaur.services.SprintService;
import com.taskosaur.taskosaur.services.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class PublicController {

    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final ProjectService projectService;
    private final SprintService sprintService;
    private final TaskService taskService;

    private Project findPublicProject(String workspaceSlug, String projectSlug) {
        Workspace workspace = workspaceRepository.findBySlug(workspaceSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with slug: " + workspaceSlug));

        return projectRepository.findByWorkspaceIdAndSlug(workspace.getId(), projectSlug)
                .orElseGet(() -> projectRepository.findBySlug(projectSlug)
                        .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + projectSlug)));
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects")
    public ResponseEntity<List<ProjectResponse>> getWorkspacePublicProjects(@PathVariable String workspaceSlug) {
        Workspace workspace = workspaceRepository.findBySlug(workspaceSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with slug: " + workspaceSlug));

        List<ProjectResponse> projects = projectService.getProjectsByWorkspace(workspace.getId());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects/{projectSlug}")
    public ResponseEntity<ProjectResponse> getPublicProject(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug
    ) {
        Project project = findPublicProject(workspaceSlug, projectSlug);
        return ResponseEntity.ok(projectService.getProjectById(project.getId()));
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects/{projectSlug}/sprints")
    public ResponseEntity<List<SprintResponse>> getPublicSprints(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug
    ) {
        Project project = findPublicProject(workspaceSlug, projectSlug);
        List<SprintResponse> sprints = sprintService.findAll(null, project.getId(), null);
        return ResponseEntity.ok(sprints);
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects/{projectSlug}/sprints/{sprintId}")
    public ResponseEntity<SprintResponse> getPublicSprint(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug,
            @PathVariable String sprintId
    ) {
        SprintResponse sprint = sprintService.findOne(sprintId, null);
        return ResponseEntity.ok(sprint);
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects/{projectSlug}/sprints/{sprintId}/tasks")
    public ResponseEntity<List<TaskResponse>> getPublicSprintTasks(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug,
            @PathVariable String sprintId
    ) {
        List<TaskResponse> tasks = taskService.getTasksBySprintId(sprintId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/workspaces/{workspaceSlug}/projects/{projectSlug}/tasks")
    public ResponseEntity<List<TaskResponse>> getPublicProjectTasks(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug
    ) {
        Project project = findPublicProject(workspaceSlug, projectSlug);
        List<TaskResponse> tasks = taskService.getTasksByProjectId(project.getId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping({"/workspaces/{workspaceSlug}/projects/{projectSlug}/statuses", "/workspaces/{slug}/statuses"})
    public ResponseEntity<List<TaskStatus>> getPublicProjectStatuses(
            @PathVariable(required = false) String workspaceSlug,
            @PathVariable(required = false) String projectSlug,
            @PathVariable(required = false) String slug
    ) {
        String pSlug = projectSlug != null ? projectSlug : slug;
        Project project = projectRepository.findBySlug(pSlug)
                .orElse(null);

        if (project != null && project.getWorkflowId() != null) {
            List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId());
            return ResponseEntity.ok(statuses);
        }

        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/workspaces/{slug}/charts")
    public ResponseEntity<Map<String, Object>> getPublicProjectCharts(
            @PathVariable String slug,
            @RequestParam(required = false) List<String> types
    ) {
        Map<String, Object> charts = new HashMap<>();
        charts.put("kpi-metrics", Map.of("totalTasks", 0, "completedTasks", 0, "completionRate", 0));
        charts.put("task-priority", List.of());
        charts.put("task-status", List.of());
        charts.put("task-type", List.of());
        charts.put("sprint-velocity", List.of());
        charts.put("burndown", List.of());
        charts.put("cumulative-flow", List.of());
        charts.put("member-workload", List.of());
        return ResponseEntity.ok(charts);
    }
}

package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.project.CreateProjectRequest;
import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.services.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        ProjectResponse created = projectService.createProject(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @RequestParam(name = "workspaceId", required = false) String workspaceId
    ) {
        if (workspaceId != null && !workspaceId.isBlank()) {
            return ResponseEntity.ok(projectService.getProjectsByWorkspace(workspaceId));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/by-organization")
    public ResponseEntity<List<ProjectResponse>> getByOrganization(
            @RequestParam(name = "organizationId") String organizationId,
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "search", required = false) String search
    ) {
        return ResponseEntity.ok(projectService.getProjectsByOrganization(organizationId, workspaceId, search));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<ProjectResponse>> getArchivedProjects(
            @RequestParam(name = "workspaceId", required = false) String workspaceId
    ) {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/workspace/{workspaceId}/slug/{slug}")
    public ResponseEntity<ProjectResponse> getBySlug(
            @PathVariable String workspaceId,
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(projectService.getProjectBySlug(workspaceId, slug));
    }

    @GetMapping("/by-slug/{slug}")
    public ResponseEntity<ProjectResponse> getBySlugOnly(@PathVariable String slug) {
        return ResponseEntity.ok(projectService.getProjectBySlugOnly(slug));
    }

    @GetMapping("/{slug}/charts")
    public ResponseEntity<Map<String, Object>> getProjectCharts(
            @PathVariable String slug,
            @RequestParam(required = false) List<String> types) {
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

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}

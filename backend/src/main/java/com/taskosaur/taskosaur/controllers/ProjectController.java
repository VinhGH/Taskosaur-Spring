package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.project.CreateProjectRequest;
import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.dto.project.UpdateProjectRequest;
import com.taskosaur.taskosaur.services.ProjectChartsService;
import com.taskosaur.taskosaur.services.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectChartsService projectChartsService;

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
        return ResponseEntity.ok(projectChartsService.getProjectCharts(slug, types));
    }

    @GetMapping("/bulk-health-stats")
    public ResponseEntity<Map<String, Object>> getBulkProjectHealthStats(
            @RequestParam(name = "projectIds", required = false) String projectIds
    ) {
        if (projectIds == null || projectIds.isBlank()) {
            return ResponseEntity.ok(Map.of());
        }
        List<String> ids = List.of(projectIds.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return ResponseEntity.ok(projectService.getBulkProjectHealthStats(ids));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateProjectRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        ProjectResponse updated = projectService.updateProject(id, request, currentUserId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/archive/{id}")
    public ResponseEntity<ProjectResponse> archive(@PathVariable String id) {
        return ResponseEntity.ok(projectService.archiveProject(id));
    }

    @PatchMapping("/unarchive/{id}")
    public ResponseEntity<ProjectResponse> unarchive(@PathVariable String id) {
        return ResponseEntity.ok(projectService.unarchiveProject(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}

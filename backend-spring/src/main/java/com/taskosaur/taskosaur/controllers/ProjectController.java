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

import java.util.List;

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

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/workspace/{workspaceId}/slug/{slug}")
    public ResponseEntity<ProjectResponse> getBySlug(
            @PathVariable String workspaceId,
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(projectService.getProjectBySlug(workspaceId, slug));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}

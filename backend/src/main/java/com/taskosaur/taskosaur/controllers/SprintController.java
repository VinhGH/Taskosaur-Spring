package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.sprint.CreateSprintRequest;
import com.taskosaur.taskosaur.dto.sprint.SprintResponse;
import com.taskosaur.taskosaur.dto.sprint.UpdateSprintRequest;
import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.services.SprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<SprintResponse> create(
            @RequestBody CreateSprintRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.createSprint(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SprintResponse>> findAll(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) SprintStatus status,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        List<SprintResponse> sprints = sprintService.findAll(userId, projectId, status);
        return ResponseEntity.ok(sprints);
    }

    @GetMapping("/slug")
    public ResponseEntity<List<SprintResponse>> findAllByProjectSlug(
            @RequestParam(required = false) String slug,
            @RequestParam(required = false) SprintStatus status,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        List<SprintResponse> sprints = sprintService.findAllByProjectSlug(userId, slug, status);
        return ResponseEntity.ok(sprints);
    }

    @GetMapping("/by-slug/{projectSlug}/{sprintSlug}")
    public ResponseEntity<SprintResponse> findBySlug(
            @PathVariable String projectSlug,
            @PathVariable String sprintSlug,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.findBySlug(projectSlug, sprintSlug, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/project/{projectId}/active")
    public ResponseEntity<SprintResponse> getActiveSprint(
            @PathVariable String projectId,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.getActiveSprint(projectId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SprintResponse> findOne(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.findOne(id, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SprintResponse> update(
            @PathVariable String id,
            @RequestBody UpdateSprintRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.update(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<SprintResponse> startSprint(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.startSprint(id, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<SprintResponse> completeSprint(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        SprintResponse response = sprintService.completeSprint(id, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        sprintService.remove(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/archive/{id}")
    public ResponseEntity<Void> archiveSprint(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        sprintService.archiveSprint(id, userId);
        return ResponseEntity.noContent().build();
    }
}

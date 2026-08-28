package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.organization.CreateOrganizationRequest;
import com.taskosaur.taskosaur.dto.organization.OrganizationResponse;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.services.OrganizationService;
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
@RequestMapping("/api/organizations")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    // ─── POST /api/organizations ───────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        String userId = authentication.getName();
        OrganizationResponse response = organizationService.createOrganization(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── GET /api/organizations/slug/{slug} ────────────────────────────────────
    @GetMapping("/slug/{slug}")
    public ResponseEntity<OrganizationResponse> getBySlug(
            @PathVariable String slug,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(organizationService.getOrganizationBySlug(slug, userId));
    }

    // ─── GET /api/organizations/{id}/charts ────────────────────────────────────
    @GetMapping("/{id}/charts")
    public ResponseEntity<Map<String, Object>> getCharts(
            @PathVariable String id,
            @RequestParam(required = false) List<String> types
    ) {
        Map<String, Object> charts = new HashMap<>();
        charts.put("kpi-metrics", Map.of("totalProjects", 0, "activeProjects", 0, "completionRate", 0));
        charts.put("project-portfolio", List.of());
        charts.put("team-utilization", List.of());
        charts.put("task-distribution", List.of());
        charts.put("task-type", List.of());
        charts.put("sprint-metrics", Map.of());
        charts.put("quality-metrics", Map.of());
        charts.put("workspace-project-count", List.of());
        charts.put("member-workload", List.of());
        charts.put("resource-allocation", List.of());
        return ResponseEntity.ok(charts);
    }

    // ─── GET /api/organizations/{id} ──────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(organizationService.getOrganizationById(id, userId));
    }

    // ─── PATCH /api/organizations/{id} ────────────────────────────────────────
    @PatchMapping("/{id}")
    public ResponseEntity<OrganizationResponse> updateOrganization(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(organizationService.updateOrganization(id, updates, userId));
    }

    // ─── DELETE /api/organizations/{id} ───────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrganization(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }
}

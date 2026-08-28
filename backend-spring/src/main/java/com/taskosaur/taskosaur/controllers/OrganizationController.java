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

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

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

    @GetMapping("/slug/{slug}")
    public ResponseEntity<OrganizationResponse> getBySlug(
            @PathVariable String slug,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(organizationService.getOrganizationBySlug(slug, userId));
    }

    @GetMapping("/{id}/charts")
    public ResponseEntity<java.util.Map<String, Object>> getCharts(
            @PathVariable String id,
            @RequestParam(required = false) List<String> types
    ) {
        java.util.Map<String, Object> charts = new java.util.HashMap<>();
        charts.put("kpi-metrics", java.util.Map.of("totalProjects", 0, "activeProjects", 0, "completionRate", 0));
        charts.put("project-portfolio", List.of());
        charts.put("team-utilization", List.of());
        charts.put("task-distribution", List.of());
        charts.put("task-type", List.of());
        charts.put("sprint-metrics", java.util.Map.of());
        charts.put("quality-metrics", java.util.Map.of());
        charts.put("workspace-project-count", List.of());
        charts.put("member-workload", List.of());
        charts.put("resource-allocation", List.of());
        return ResponseEntity.ok(charts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getById(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(organizationService.getOrganizationById(id, userId));
    }
}

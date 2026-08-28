package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.models.Organization;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.models.Workflow;
import com.taskosaur.taskosaur.repositories.OrganizationRepository;
import com.taskosaur.taskosaur.services.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWorkflows(
            @RequestParam(name = "organizationId", required = false) String organizationId) {
        if (organizationId != null && !organizationId.isBlank()) {
            List<Workflow> list = workflowService.getWorkflowsByOrganizationId(organizationId);
            return ResponseEntity.ok(list.stream().map(workflowService::toWorkflowMap).toList());
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/slug")
    public ResponseEntity<List<Map<String, Object>>> getWorkflowsBySlug(
            @RequestParam(name = "slug") String slug) {
        Organization org = organizationRepository.findBySlug(slug).orElse(null);
        if (org != null) {
            List<Workflow> list = workflowService.getWorkflowsByOrganizationId(org.getId());
            return ResponseEntity.ok(list.stream().map(workflowService::toWorkflowMap).toList());
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/organization/{organizationId}/default")
    public ResponseEntity<Map<String, Object>> getDefaultWorkflow(
            @PathVariable String organizationId,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : "system";
        Workflow wf = workflowService.getOrCreateDefaultWorkflow(organizationId, userId);
        return ResponseEntity.ok(workflowService.toWorkflowMap(wf));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Workflow> getById(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getWorkflowById(id));
    }

    @GetMapping("/{id}/statuses")
    public ResponseEntity<List<TaskStatus>> getStatuses(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getWorkflowStatuses(id));
    }
}

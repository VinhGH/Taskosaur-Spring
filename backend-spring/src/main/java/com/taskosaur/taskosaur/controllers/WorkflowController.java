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

    @GetMapping("/{id}/stages")
    public ResponseEntity<List<TaskStatus>> getStages(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getWorkflowStages(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Workflow>> searchWorkflows(
            @RequestParam(name = "organizationId") String organizationId,
            @RequestParam(name = "search", required = false) String search
    ) {
        return ResponseEntity.ok(workflowService.searchWorkflows(organizationId, search));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getWorkflowStats(@PathVariable String id) {
        List<com.taskosaur.taskosaur.models.TaskStatus> statuses = workflowService.getWorkflowStages(id);
        List<Map<String, Object>> stageStats = statuses.stream()
                .map(s -> Map.<String, Object>of(
                        "statusId", s.getId(),
                        "name", s.getName(),
                        "color", s.getColor(),
                        "category", s.getCategory().name(),
                        "taskCount", 0
                ))
                .toList();

        return ResponseEntity.ok(Map.of(
                "workflowId", id,
                "totalStages", statuses.size(),
                "stages", stageStats
        ));
    }

    @PostMapping
    public ResponseEntity<Workflow> createWorkflow(
            @jakarta.validation.Valid @RequestBody com.taskosaur.taskosaur.dto.workflow.CreateWorkflowRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.createWorkflow(request, userId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Workflow> updateWorkflow(
            @PathVariable String id,
            @RequestBody com.taskosaur.taskosaur.dto.workflow.UpdateWorkflowRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.updateWorkflow(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteWorkflow(@PathVariable String id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Workflow deleted successfully"));
    }

    @PatchMapping("/{id}/set-default")
    public ResponseEntity<Workflow> setDefault(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String orgId = body != null ? body.get("organizationId") : null;
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.setDefaultWorkflow(id, orgId, userId));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Workflow> activate(@PathVariable String id, Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.activateWorkflow(id, userId));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Workflow> deactivate(@PathVariable String id, Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.deactivateWorkflow(id, userId));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Workflow> archive(@PathVariable String id, Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.archiveWorkflow(id, userId));
    }
}

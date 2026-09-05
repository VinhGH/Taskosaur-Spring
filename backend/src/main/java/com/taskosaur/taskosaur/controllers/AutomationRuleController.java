package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.automation.AutomationRuleResponse;
import com.taskosaur.taskosaur.dto.automation.CreateAutomationRuleRequest;
import com.taskosaur.taskosaur.dto.automation.UpdateAutomationRuleRequest;
import com.taskosaur.taskosaur.models.RuleExecution;
import com.taskosaur.taskosaur.services.AutomationRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/automation-rules")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class AutomationRuleController {

    private final AutomationRuleService automationRuleService;

    @PostMapping
    public ResponseEntity<AutomationRuleResponse> createRule(
            @Valid @RequestBody CreateAutomationRuleRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(automationRuleService.createRule(request, userId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<AutomationRuleResponse>> getRulesByProject(@PathVariable String projectId) {
        return ResponseEntity.ok(automationRuleService.getRulesByProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AutomationRuleResponse> getRuleById(@PathVariable String id) {
        return ResponseEntity.ok(automationRuleService.getRuleById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AutomationRuleResponse> updateRule(
            @PathVariable String id,
            @RequestBody UpdateAutomationRuleRequest request,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(automationRuleService.updateRule(id, request, userId));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<AutomationRuleResponse> toggleRule(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(automationRuleService.toggleRuleStatus(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRule(@PathVariable String id) {
        automationRuleService.deleteRule(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Rule deleted successfully"));
    }

    @GetMapping("/{id}/executions")
    public ResponseEntity<List<RuleExecution>> getRuleExecutions(@PathVariable String id) {
        return ResponseEntity.ok(automationRuleService.getRuleExecutions(id));
    }
}

package com.taskosaur.taskosaur.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/inbox")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class ProjectInboxController {

    // ─── GET /api/projects/{projectId}/inbox ──────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getInbox(@PathVariable String projectId) {
        // Return null with 200 OK if no inbox configured for project
        return ResponseEntity.ok(null);
    }

    // ─── POST /api/projects/{projectId}/inbox ─────────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> createInbox(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "projectId", projectId,
                "name", body.getOrDefault("name", "Project Inbox"),
                "enabled", true
        ));
    }

    // ─── PUT /api/projects/{projectId}/inbox ──────────────────────────────────
    @PutMapping
    public ResponseEntity<Map<String, Object>> updateInbox(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(Map.of(
                "projectId", projectId,
                "enabled", body.getOrDefault("enabled", true)
        ));
    }

    // ─── PUT /api/projects/{projectId}/inbox/email-account ────────────────────
    @PutMapping("/email-account")
    public ResponseEntity<Map<String, Object>> setupEmailAccount(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(Map.of(
                "projectId", projectId,
                "emailAddress", body.getOrDefault("emailAddress", ""),
                "status", "configured"
        ));
    }

    // ─── POST /api/projects/{projectId}/inbox/sync ────────────────────────────
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncInbox(@PathVariable String projectId) {
        return ResponseEntity.ok(Map.of(
                "message", "Email sync completed",
                "status", "synced"
        ));
    }

    // ─── GET /api/projects/{projectId}/inbox/messages ─────────────────────────
    @GetMapping("/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(@PathVariable String projectId) {
        return ResponseEntity.ok(List.of());
    }

    // ─── GET /api/projects/{projectId}/inbox/rules ────────────────────────────
    @GetMapping("/rules")
    public ResponseEntity<List<Map<String, Object>>> getRules(@PathVariable String projectId) {
        return ResponseEntity.ok(List.of());
    }

    // ─── POST /api/projects/{projectId}/inbox/rules ───────────────────────────
    @PostMapping("/rules")
    public ResponseEntity<Map<String, Object>> createRule(
            @PathVariable String projectId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    // ─── DELETE /api/projects/{projectId}/inbox/rules/{ruleId} ────────────────
    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<Map<String, Object>> deleteRule(
            @PathVariable String projectId,
            @PathVariable String ruleId
    ) {
        return ResponseEntity.ok(Map.of("message", "Rule deleted successfully", "success", true));
    }
}

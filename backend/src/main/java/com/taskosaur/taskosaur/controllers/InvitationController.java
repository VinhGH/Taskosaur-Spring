package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.services.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    // ─── POST /api/invitations ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> createInvitation(
            Authentication authentication,
            @RequestBody Map<String, String> body
    ) {
        String inviterId = authentication != null ? authentication.getName() : "system";
        Map<String, Object> result = invitationService.createInvitation(
                inviterId,
                body.get("inviteeEmail"),
                body.get("organizationId"),
                body.get("workspaceId"),
                body.get("projectId"),
                body.get("role")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ─── GET /api/invitations/user ─────────────────────────────────────────────
    @GetMapping("/user")
    public ResponseEntity<List<Map<String, Object>>> getUserInvitations(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId
    ) {
        String email = authentication != null ? authentication.getName() : null;
        if (email == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(invitationService.getUserInvitations(email, status, entityType, entityId));
    }

    // ─── GET /api/invitations/entity/{entityType}/{entityId} ───────────────────
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Map<String, Object>>> getEntityInvitations(
            @PathVariable String entityType,
            @PathVariable String entityId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(invitationService.getEntityInvitations(entityType, entityId, status));
    }

    // ─── GET /api/invitations/verify/{token} ───────────────────────────────────
    @GetMapping("/verify/{token}")
    public ResponseEntity<Map<String, Object>> verifyInvitation(@PathVariable String token) {
        return ResponseEntity.ok(invitationService.verifyInvitation(token));
    }

    // ─── PATCH /api/invitations/{token}/accept ─────────────────────────────────
    @PatchMapping("/{token}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvitation(
            @PathVariable String token,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(invitationService.acceptInvitation(token, currentUserId));
    }

    // ─── PATCH /api/invitations/{token}/decline ────────────────────────────────
    @PatchMapping("/{token}/decline")
    public ResponseEntity<Map<String, Object>> declineInvitation(@PathVariable String token) {
        return ResponseEntity.ok(invitationService.declineInvitation(token));
    }

    // ─── POST /api/invitations/{id}/resend ────────────────────────────────────
    @PostMapping("/{id}/resend")
    public ResponseEntity<Map<String, Object>> resendInvitation(@PathVariable String id) {
        return ResponseEntity.ok(invitationService.resendInvitation(id));
    }

    // ─── DELETE /api/invitations/{id} ─────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteInvitation(@PathVariable String id) {
        return ResponseEntity.ok(invitationService.deleteInvitation(id));
    }
}

package com.taskosaur.taskosaur.controllers;

import lombok.RequiredArgsConstructor;
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

    @GetMapping("/user")
    public ResponseEntity<List<Object>> getUserInvitations(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId
    ) {
        // Return empty invitations list for user
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Object>> getEntityInvitations(
            @PathVariable String entityType,
            @PathVariable String entityId
    ) {
        return ResponseEntity.ok(List.of());
    }

    @PatchMapping("/{token}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvitation(@PathVariable String token) {
        return ResponseEntity.ok(Map.of("message", "Invitation accepted", "success", true));
    }

    @PatchMapping("/{token}/decline")
    public ResponseEntity<Map<String, Object>> declineInvitation(@PathVariable String token) {
        return ResponseEntity.ok(Map.of("message", "Invitation declined", "success", true));
    }
}

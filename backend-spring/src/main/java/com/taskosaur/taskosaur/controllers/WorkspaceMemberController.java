package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.workspace.AddMemberRequest;
import com.taskosaur.taskosaur.models.WorkspaceMember;
import com.taskosaur.taskosaur.services.WorkspaceMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/workspace-members")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class WorkspaceMemberController {

    private final WorkspaceMemberService workspaceMemberService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWorkspaceMembers(
            @RequestParam(name = "workspaceId", required = false) String workspaceId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(workspaceMemberService.findAll(workspaceId, search, page, limit));
    }

    @PostMapping
    public ResponseEntity<WorkspaceMember> createMember(@Valid @RequestBody AddMemberRequest request) {
        WorkspaceMember created = workspaceMemberService.create(
                request.getWorkspaceId(),
                request.getUserId(),
                request.getRole()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/workspace/{workspaceId}/stats")
    public ResponseEntity<Map<String, Object>> getWorkspaceStats(@PathVariable String workspaceId) {
        return ResponseEntity.ok(workspaceMemberService.getWorkspaceStats(workspaceId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WorkspaceMember> updateRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String roleStr = body.get("role");
        com.taskosaur.taskosaur.enums.WorkspaceRole role = roleStr != null
                ? com.taskosaur.taskosaur.enums.WorkspaceRole.valueOf(roleStr)
                : com.taskosaur.taskosaur.enums.WorkspaceRole.MEMBER;
        return ResponseEntity.ok(workspaceMemberService.updateRole(id, role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable String id) {
        workspaceMemberService.remove(id);
        return ResponseEntity.noContent().build();
    }
}

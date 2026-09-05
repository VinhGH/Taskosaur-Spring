package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.models.ProjectMember;
import com.taskosaur.taskosaur.services.ProjectMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-members")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    // ─── GET /api/project-members?projectId=&search=&page=&limit= ─────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProjectMembers(
            @RequestParam(name = "projectId", required = false) String projectId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(projectMemberService.findAll(projectId, search, page, limit));
    }

    // ─── GET /api/project-members/user/{userId}/projects ──────────────────────
    @GetMapping("/user/{userId}/projects")
    public ResponseEntity<List<Map<String, Object>>> getProjectsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(projectMemberService.getProjectsByUserId(userId));
    }

    // ─── GET /api/project-members/workspace/{workspaceId} ─────────────────────
    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<Map<String, Object>>> getMembersByWorkspace(@PathVariable String workspaceId) {
        return ResponseEntity.ok(projectMemberService.findByWorkspace(workspaceId));
    }

    // ─── GET /api/project-members/project/{projectId}/stats ───────────────────
    @GetMapping("/project/{projectId}/stats")
    public ResponseEntity<Map<String, Object>> getProjectStats(@PathVariable String projectId) {
        return ResponseEntity.ok(projectMemberService.getProjectStats(projectId));
    }

    // ─── POST /api/project-members ────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ProjectMember> addMember(@RequestBody Map<String, String> body) {
        String projectId = body.get("projectId");
        String userId = body.get("userId");
        String roleStr = body.get("role");
        Role role = parseRole(roleStr);
        ProjectMember created = projectMemberService.addMember(projectId, userId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─── POST /api/project-members/invite ─────────────────────────────────────
    @PostMapping("/invite")
    public ResponseEntity<ProjectMember> inviteMember(@RequestBody Map<String, String> body) {
        String projectId = body.get("projectId");
        String email = body.get("email");
        String roleStr = body.get("role");
        Role role = parseRole(roleStr);
        ProjectMember created = projectMemberService.inviteMember(projectId, email, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─── PATCH /api/project-members/{id} ──────────────────────────────────────
    @PatchMapping("/{id}")
    public ResponseEntity<ProjectMember> updateRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        Role role = parseRole(body.get("role"));
        return ResponseEntity.ok(projectMemberService.updateRole(id, role));
    }

    // ─── DELETE /api/project-members/{id} ─────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable String id) {
        projectMemberService.remove(id);
        return ResponseEntity.noContent().build();
    }

    // ─── POST /api/project-members/bulk-remove ────────────────────────────────
    @PostMapping("/bulk-remove")
    public ResponseEntity<Map<String, Object>> bulkRemove(@RequestBody Map<String, List<String>> body) {
        List<String> memberIds = body.get("memberIds");
        int removed = projectMemberService.bulkRemove(memberIds != null ? memberIds : List.of());
        return ResponseEntity.ok(Map.of("removed", removed));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private Role parseRole(String roleStr) {
        if (roleStr == null || roleStr.isBlank()) return Role.MEMBER;
        try {
            return Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Role.MEMBER;
        }
    }
}

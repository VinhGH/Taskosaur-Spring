package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.workspace.AddMemberRequest;
import com.taskosaur.taskosaur.dto.workspace.CreateWorkspaceRequest;
import com.taskosaur.taskosaur.dto.workspace.UpdateWorkspaceRequest;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.models.WorkspaceMember;
import com.taskosaur.taskosaur.services.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final com.taskosaur.taskosaur.services.ChartsService chartsService;
    private final com.taskosaur.taskosaur.services.ActivityLogService activityLogService;

    // POST /api/workspaces -> Tạo workspace
    @PostMapping
    public ResponseEntity<Workspace> create(
            @Valid @RequestBody CreateWorkspaceRequest request,
            Authentication authentication) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        Workspace created = workspaceService.createWorkspace(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET /api/workspaces?organizationId=... -> Lấy danh sách workspace
    @GetMapping
    public ResponseEntity<List<Workspace>> getWorkspaces(
            @RequestParam(name = "organizationId", required = false) String organizationId) {
        if (organizationId != null && !organizationId.isBlank()) {
            return ResponseEntity.ok(workspaceService.getWorkspacesByOrganization(organizationId));
        }
        return ResponseEntity.ok(List.of());
    }

    // GET /api/workspaces/tree?organizationId=...
    @GetMapping("/tree")
    public ResponseEntity<List<Workspace>> getWorkspaceTree(
            @RequestParam(name = "organizationId", required = false) String organizationId) {
        if (organizationId != null && !organizationId.isBlank()) {
            return ResponseEntity.ok(workspaceService.getWorkspacesByOrganization(organizationId));
        }
        return ResponseEntity.ok(List.of());
    }

    // GET /api/workspaces/search
    @GetMapping("/search")
    public ResponseEntity<List<Workspace>> searchWorkspaces(
            @RequestParam(name = "organizationId", required = false) String organizationId) {
        if (organizationId != null && !organizationId.isBlank()) {
            return ResponseEntity.ok(workspaceService.getWorkspacesByOrganization(organizationId));
        }
        return ResponseEntity.ok(List.of());
    }

    // GET /api/workspaces/archived
    @GetMapping("/archived")
    public ResponseEntity<List<Workspace>> getArchivedWorkspaces(
            @RequestParam(name = "organizationId", required = false) String organizationId) {
        return ResponseEntity.ok(List.of());
    }

    // GET /api/workspaces/recent/{workspaceId}
    @GetMapping("/recent/{workspaceId}")
    public ResponseEntity<java.util.Map<String, Object>> getRecentActivities(
            @PathVariable("workspaceId") String workspaceId,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "userId", required = false) String userId) {
        return ResponseEntity.ok(activityLogService.getRecentActivityByWorkspace(workspaceId, limit, page, entityType, userId));
    }

    // GET /api/workspaces/{id} -> Lấy chi tiết 1 workspace
    @GetMapping("/{id}")
    public ResponseEntity<Workspace> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(workspaceService.getWorkspaceById(id));
    }

    // GET /api/workspaces/{id}/ancestors
    @GetMapping("/{id}/ancestors")
    public ResponseEntity<List<Workspace>> getAncestors(@PathVariable("id") String id) {
        return ResponseEntity.ok(workspaceService.getAncestors(id));
    }

    // PATCH /api/workspaces/archive/{id}
    @PatchMapping("/archive/{id}")
    public ResponseEntity<Workspace> archiveWorkspace(@PathVariable("id") String id) {
        return ResponseEntity.ok(workspaceService.archiveWorkspace(id));
    }

    // PATCH /api/workspaces/unarchive/{id}
    @PatchMapping("/unarchive/{id}")
    public ResponseEntity<Workspace> unarchiveWorkspace(@PathVariable("id") String id) {
        return ResponseEntity.ok(workspaceService.unarchiveWorkspace(id));
    }

    // POST /api/workspaces/{id}/apply-inheritance
    @PostMapping("/{id}/apply-inheritance")
    public ResponseEntity<java.util.Map<String, Object>> applyInheritance(
            @PathVariable("id") String id,
            @RequestBody(required = false) java.util.Map<String, Object> options
    ) {
        return ResponseEntity.ok(workspaceService.applyInheritance(id, options != null ? options : java.util.Map.of()));
    }

    // PATCH /api/workspaces/{id} -> Cập nhật workspace
    @PatchMapping("/{id}")
    public ResponseEntity<Workspace> update(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateWorkspaceRequest request) {
        return ResponseEntity.ok(workspaceService.updateWorkspace(id, request));
    }

    // DELETE /api/workspaces/{id} -> Xóa workspace
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/workspaces/members -> Thêm thành viên
    @PostMapping("/members")
    public ResponseEntity<WorkspaceMember> addMember(@Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.addMember(request));
    }

    // GET /api/workspaces/{id}/members -> Lấy danh sách thành viên của 1 workspace
    @GetMapping("/{id}/members")
    public ResponseEntity<List<WorkspaceMember>> getMembers(@PathVariable("id") String workspaceId) {
        return ResponseEntity.ok(workspaceService.getMembers(workspaceId));
    }

    // DELETE /api/workspaces/members/{memberId} -> Xóa thành viên
    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable("memberId") String memberId) {
        workspaceService.removeMember(memberId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/organization/{organizationId}/slug/{slug}")
    public ResponseEntity<Workspace> getBySlug(
            @PathVariable("organizationId") String organizationId,
            @PathVariable("slug") String slug) {
        return ResponseEntity.ok(workspaceService.getWorkspaceBySlug(organizationId, slug));
    }

    @GetMapping("/organization/{organizationId}/workspace/{slug}/charts")
    public ResponseEntity<java.util.Map<String, Object>> getWorkspaceCharts(
            @PathVariable("organizationId") String organizationId,
            @PathVariable("slug") String slug,
            @RequestParam(name = "types", required = false) List<String> types,
            Authentication authentication
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(chartsService.getWorkspaceCharts(organizationId, slug, userId, types));
    }
}
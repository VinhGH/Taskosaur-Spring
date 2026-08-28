package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.WorkspaceRole;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.models.WorkspaceMember;
import com.taskosaur.taskosaur.repositories.UserRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceMemberRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceMemberService {

    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public Map<String, Object> findAll(String workspaceId, String search, int page, int limit) {
        List<WorkspaceMember> members;
        if (workspaceId != null && !workspaceId.isBlank()) {
            members = workspaceMemberRepository.findByWorkspaceId(workspaceId);
        } else {
            members = workspaceMemberRepository.findAll();
        }

        Workspace ws = workspaceId != null ? workspaceRepository.findById(workspaceId).orElse(null) : null;
        List<Map<String, Object>> memberData = new ArrayList<>();

        for (WorkspaceMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (search != null && !search.isBlank() && !matchesSearch(u, search)) {
                continue;
            }
            memberData.add(buildMemberMap(m, u, ws));
        }

        return Map.of(
                "data", memberData,
                "total", memberData.size(),
                "page", page,
                "limit", limit
        );
    }

    private boolean matchesSearch(User u, String search) {
        if (u == null) return false;
        String query = search.toLowerCase();
        boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(query);
        boolean firstMatch = u.getFirstName() != null && u.getFirstName().toLowerCase().contains(query);
        boolean lastMatch = u.getLastName() != null && u.getLastName().toLowerCase().contains(query);
        return emailMatch || firstMatch || lastMatch;
    }

    private Map<String, Object> buildMemberMap(WorkspaceMember m, User u, Workspace ws) {
        Map<String, Object> mObj = new HashMap<>();
        mObj.put("id", m.getId());
        mObj.put("role", m.getRole().name());
        mObj.put("userId", m.getUserId());
        mObj.put("workspaceId", m.getWorkspaceId());
        mObj.put("createdAt", m.getCreatedAt());
        mObj.put("updatedAt", m.getUpdatedAt());

        if (u != null) {
            mObj.put("user", Map.of(
                    "id", u.getId(),
                    "email", u.getEmail() != null ? u.getEmail() : "",
                    "firstName", u.getFirstName() != null ? u.getFirstName() : "",
                    "lastName", u.getLastName() != null ? u.getLastName() : "",
                    "status", u.getStatus() != null ? u.getStatus().name() : "ACTIVE"
            ));
        }

        if (ws != null) {
            mObj.put("workspace", Map.of(
                    "id", ws.getId(),
                    "name", ws.getName(),
                    "slug", ws.getSlug()
            ));
        }

        return mObj;
    }

    public WorkspaceMember create(String workspaceId, String userId, WorkspaceRole role) {
        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new ConflictException("User is already a member of this workspace");
        }
        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(userId)
                .role(role != null ? role : WorkspaceRole.MEMBER)
                .build();
        return workspaceMemberRepository.save(member);
    }

    public WorkspaceMember updateRole(String id, WorkspaceRole role) {
        WorkspaceMember member = workspaceMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace member not found"));
        member.setRole(role);
        return workspaceMemberRepository.save(member);
    }

    public void remove(String id) {
        workspaceMemberRepository.deleteById(id);
    }

    public Map<String, Object> getWorkspaceStats(String workspaceId) {
        long total = workspaceMemberRepository.countByWorkspaceId(workspaceId);
        return Map.of(
                "totalMembers", total,
                "activeMembers", total
        );
    }
}

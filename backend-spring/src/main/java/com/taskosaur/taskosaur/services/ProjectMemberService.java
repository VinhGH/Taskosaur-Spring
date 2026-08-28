package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.ProjectMember;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.ProjectMemberRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // ─── List / Search ────────────────────────────────────────────────────────

    public Map<String, Object> findAll(String projectId, String search, int page, int limit) {
        List<ProjectMember> members;
        if (projectId != null && !projectId.isBlank()) {
            members = projectMemberRepository.findByProjectId(projectId);
        } else {
            members = projectMemberRepository.findAll();
        }

        Project project = projectId != null ? projectRepository.findById(projectId).orElse(null) : null;
        List<Map<String, Object>> memberData = new ArrayList<>();

        for (ProjectMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (search != null && !search.isBlank() && !matchesSearch(u, search)) {
                continue;
            }
            memberData.add(buildMemberMap(m, u, project));
        }

        // Manual pagination
        int total = memberData.size();
        int fromIndex = Math.max(0, (page - 1) * limit);
        int toIndex = Math.min(total, fromIndex + limit);
        List<Map<String, Object>> paged = (fromIndex < total) ? memberData.subList(fromIndex, toIndex) : List.of();

        return Map.of(
                "data", paged,
                "total", total,
                "page", page,
                "limit", limit
        );
    }

    // ─── Get members by workspace ──────────────────────────────────────────────

    public List<Map<String, Object>> findByWorkspace(String workspaceId) {
        // Get all projects in this workspace, then get all members of those projects
        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> seenMemberIds = new HashSet<>();

        for (Project proj : projects) {
            List<ProjectMember> members = projectMemberRepository.findByProjectId(proj.getId());
            for (ProjectMember m : members) {
                if (seenMemberIds.contains(m.getId())) continue;
                seenMemberIds.add(m.getId());
                User u = userRepository.findById(m.getUserId()).orElse(null);
                result.add(buildMemberMap(m, u, proj));
            }
        }
        return result;
    }

    // ─── Get projects for a user ───────────────────────────────────────────────

    public List<Map<String, Object>> getProjectsByUserId(String userId) {
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ProjectMember m : memberships) {
            Project proj = projectRepository.findById(m.getProjectId()).orElse(null);
            if (proj == null) continue;
            Map<String, Object> projMap = new HashMap<>();
            projMap.put("id", proj.getId());
            projMap.put("name", proj.getName());
            projMap.put("slug", proj.getSlug());
            projMap.put("workspaceId", proj.getWorkspaceId());
            projMap.put("memberRole", m.getRole().name());
            result.add(projMap);
        }
        return result;
    }

    // ─── Add member (by userId) ────────────────────────────────────────────────

    public ProjectMember addMember(String projectId, String userId, Role role) {
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ConflictException("User is already a member of this project");
        }
        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(userId)
                .role(role != null ? role : Role.MEMBER)
                .build();
        return projectMemberRepository.save(member);
    }

    // ─── Invite member (by email) ──────────────────────────────────────────────

    public ProjectMember inviteMember(String projectId, String email, Role role) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with email: " + email));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new ConflictException("User is already a member of this project");
        }
        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(user.getId())
                .role(role != null ? role : Role.MEMBER)
                .build();
        return projectMemberRepository.save(member);
    }

    // ─── Update role ───────────────────────────────────────────────────────────

    public ProjectMember updateRole(String memberId, Role role) {
        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));
        member.setRole(role);
        return projectMemberRepository.save(member);
    }

    // ─── Remove member ─────────────────────────────────────────────────────────

    public void remove(String memberId) {
        if (!projectMemberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Project member not found");
        }
        projectMemberRepository.deleteById(memberId);
    }

    // ─── Bulk remove ───────────────────────────────────────────────────────────

    public int bulkRemove(List<String> memberIds) {
        int count = 0;
        for (String id : memberIds) {
            if (projectMemberRepository.existsById(id)) {
                projectMemberRepository.deleteById(id);
                count++;
            }
        }
        return count;
    }

    // ─── Project stats ─────────────────────────────────────────────────────────

    public Map<String, Object> getProjectStats(String projectId) {
        long total = projectMemberRepository.countByProjectId(projectId);
        return Map.of(
                "totalMembers", total,
                "activeMembers", total
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private boolean matchesSearch(User u, String search) {
        if (u == null) return false;
        String q = search.toLowerCase();
        boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
        boolean firstMatch = u.getFirstName() != null && u.getFirstName().toLowerCase().contains(q);
        boolean lastMatch = u.getLastName() != null && u.getLastName().toLowerCase().contains(q);
        return emailMatch || firstMatch || lastMatch;
    }

    private Map<String, Object> buildMemberMap(ProjectMember m, User u, Project proj) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("role", m.getRole().name());
        map.put("userId", m.getUserId());
        map.put("projectId", m.getProjectId());
        map.put("joinedAt", m.getJoinedAt());
        map.put("createdAt", m.getCreatedAt());
        map.put("updatedAt", m.getUpdatedAt());

        if (u != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", u.getId());
            userMap.put("email", u.getEmail() != null ? u.getEmail() : "");
            userMap.put("firstName", u.getFirstName() != null ? u.getFirstName() : "");
            userMap.put("lastName", u.getLastName() != null ? u.getLastName() : "");
            userMap.put("username", u.getUsername() != null ? u.getUsername() : "");
            userMap.put("avatar", u.getAvatar() != null ? u.getAvatar() : "");
            map.put("user", userMap);
        }

        if (proj != null) {
            Map<String, Object> projMap = new HashMap<>();
            projMap.put("id", proj.getId());
            projMap.put("name", proj.getName());
            projMap.put("slug", proj.getSlug());
            map.put("project", projMap);
        }

        return map;
    }
}

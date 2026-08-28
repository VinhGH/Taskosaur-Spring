package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.organization.CreateOrganizationRequest;
import com.taskosaur.taskosaur.dto.organization.OrganizationResponse;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Organization;
import com.taskosaur.taskosaur.models.OrganizationMember;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.OrganizationMemberRepository;
import com.taskosaur.taskosaur.repositories.OrganizationRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    private String generateSlug(String name) {
        String slug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
        if (organizationRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }
        return slug;
    }

    public List<OrganizationResponse> getUserOrganizations(String userId) {
        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> organizationRepository.findById(m.getOrganizationId()).orElse(null))
                .filter(Objects::nonNull)
                .map(org -> buildOrganizationResponse(org, userId))
                .toList();
    }

    public OrganizationResponse createOrganization(CreateOrganizationRequest request, String userId) {
        String slug = resolveSlug(request.getName(), request.getSlug());
        Organization savedOrg = saveNewOrganization(request, slug, userId);
        saveOwnerMembership(savedOrg.getId(), userId);
        updateUserDefaultOrganizationIfNull(userId, savedOrg.getId());
        initDefaultWorkspaceIfRequested(savedOrg.getId(), userId, request.getDefaultWorkspace());

        return buildOrganizationResponse(savedOrg, userId);
    }

    private String resolveSlug(String name, String requestedSlug) {
        if (requestedSlug == null || requestedSlug.isBlank()) {
            return generateSlug(name);
        }
        if (organizationRepository.existsBySlug(requestedSlug)) {
            return generateSlug(requestedSlug);
        }
        return requestedSlug;
    }

    private Organization saveNewOrganization(CreateOrganizationRequest request, String slug, String userId) {
        Organization organization = Organization.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .website(request.getWebsite())
                .ownerId(userId)
                .createdBy(userId)
                .archive(false)
                .build();
        return organizationRepository.save(organization);
    }

    private void saveOwnerMembership(String orgId, String userId) {
        OrganizationMember member = OrganizationMember.builder()
                .organizationId(orgId)
                .userId(userId)
                .role(Role.OWNER)
                .isDefault(true)
                .createdBy(userId)
                .build();
        organizationMemberRepository.save(member);
    }

    private void updateUserDefaultOrganizationIfNull(String userId, String orgId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getDefaultOrganizationId() == null) {
                user.setDefaultOrganizationId(orgId);
                userRepository.save(user);
            }
        });
    }

    private void initDefaultWorkspaceIfRequested(String orgId, String userId, Map<String, Object> defaultWs) {
        if (defaultWs == null || defaultWs.get("name") == null) {
            return;
        }
        String wsName = defaultWs.get("name").toString().trim();
        if (wsName.isBlank()) {
            return;
        }
        Workspace ws = Workspace.builder()
                .name(wsName)
                .slug(generateSlug(wsName))
                .organizationId(orgId)
                .createdBy(userId)
                .build();
        workspaceRepository.save(ws);
    }

    public OrganizationResponse getOrganizationById(String id, String userId) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return buildOrganizationResponse(org, userId);
    }

    public OrganizationResponse getOrganizationBySlug(String slug, String userId) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with slug: " + slug));
        return buildOrganizationResponse(org, userId);
    }

    public Map<String, Object> getMembersBySlug(String slug, int page, int limit, String search) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with slug: " + slug));

        List<OrganizationMember> members = organizationMemberRepository.findByOrganizationId(org.getId());
        List<Map<String, Object>> memberData = filterAndMapMembers(members, org, search);
        Map<String, Object> roleCounts = countMemberRoles(members);

        return Map.of(
                "data", memberData,
                "total", memberData.size(),
                "page", page,
                "limit", limit,
                "roleCounts", roleCounts
        );
    }

    public List<Map<String, Object>> getMembersByOrgId(String organizationId, String search) {
        if (organizationId == null || organizationId.isBlank()) {
            return List.of();
        }
        Organization org = organizationRepository.findById(organizationId).orElse(null);
        List<OrganizationMember> members = organizationMemberRepository.findByOrganizationId(organizationId);
        return filterAndMapMembers(members, org, search);
    }

    private List<Map<String, Object>> filterAndMapMembers(List<OrganizationMember> members, Organization org, String search) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (OrganizationMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (search != null && !search.isBlank() && !matchesSearch(u, search)) {
                continue;
            }
            result.add(buildMemberMap(m, u, org));
        }
        return result;
    }

    private boolean matchesSearch(User u, String search) {
        if (u == null) return false;
        String query = search.toLowerCase();
        boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(query);
        boolean firstMatch = u.getFirstName() != null && u.getFirstName().toLowerCase().contains(query);
        boolean lastMatch = u.getLastName() != null && u.getLastName().toLowerCase().contains(query);
        return emailMatch || firstMatch || lastMatch;
    }

    private Map<String, Object> buildMemberMap(OrganizationMember m, User u, Organization org) {
        Map<String, Object> mObj = new HashMap<>();
        mObj.put("id", m.getId());
        mObj.put("role", m.getRole().name());
        mObj.put("userId", m.getUserId());
        mObj.put("organizationId", m.getOrganizationId());
        mObj.put("isDefault", m.getIsDefault());
        mObj.put("joinedAt", m.getJoinedAt());
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

        if (org != null) {
            mObj.put("organization", Map.of(
                    "id", org.getId(),
                    "name", org.getName(),
                    "slug", org.getSlug()
            ));
        }

        return mObj;
    }

    private Map<String, Object> countMemberRoles(List<OrganizationMember> members) {
        int ownerCount = 0;
        int managerCount = 0;
        int memberCount = 0;
        int viewerCount = 0;

        for (OrganizationMember m : members) {
            if (m.getRole() == Role.OWNER || m.getRole() == Role.SUPER_ADMIN) {
                ownerCount++;
            } else if (m.getRole() == Role.MANAGER) {
                managerCount++;
            } else if (m.getRole() == Role.MEMBER) {
                memberCount++;
            } else {
                viewerCount++;
            }
        }

        return Map.of(
                "OWNER", ownerCount,
                "MANAGER", managerCount,
                "MEMBER", memberCount,
                "VIEWER", viewerCount
        );
    }

    public void setDefaultOrganization(String organizationId, String userId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found");
        }

        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(userId);
        for (OrganizationMember member : memberships) {
            member.setIsDefault(member.getOrganizationId().equals(organizationId));
            organizationMemberRepository.save(member);
        }

        userRepository.findById(userId).ifPresent(user -> {
            user.setDefaultOrganizationId(organizationId);
            userRepository.save(user);
        });
    }

    private OrganizationResponse buildOrganizationResponse(Organization org, String userId) {
        long memberCount = organizationMemberRepository.countByOrganizationId(org.getId());
        long workspaceCount = workspaceRepository.findByOrganizationId(org.getId()).size();

        Role userRole = resolveUserRole(org, userId);
        boolean isDefault = resolveIsDefault(org.getId(), userId);

        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .description(org.getDescription())
                .avatar(org.getAvatar())
                .website(org.getWebsite())
                .ownerId(org.getOwnerId())
                .isOwner(userId != null && org.getOwnerId().equals(userId))
                .isDefault(isDefault)
                .userRole(userRole)
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .count(OrganizationResponse.CountDto.builder()
                        .members(memberCount)
                        .workspaces(workspaceCount)
                        .build())
                .build();
    }

    private Role resolveUserRole(Organization org, String userId) {
        if (userId == null) return Role.MEMBER;
        return organizationMemberRepository.findByUserIdAndOrganizationId(userId, org.getId())
                .map(OrganizationMember::getRole)
                .orElseGet(() -> org.getOwnerId().equals(userId) ? Role.OWNER : Role.MEMBER);
    }

    private boolean resolveIsDefault(String orgId, String userId) {
        if (userId == null) return false;
        return organizationMemberRepository.findByUserIdAndOrganizationId(userId, orgId)
                .map(OrganizationMember::getIsDefault)
                .orElse(false);
    }
}

package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.organization.CreateOrganizationRequest;
import com.taskosaur.taskosaur.dto.organization.OrganizationResponse;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.models.Organization;
import com.taskosaur.taskosaur.models.OrganizationMember;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.OrganizationMemberRepository;
import com.taskosaur.taskosaur.repositories.OrganizationRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
        List<OrganizationResponse> responses = new java.util.ArrayList<>();
        for (OrganizationMember member : memberships) {
            Organization org = organizationRepository.findById(member.getOrganizationId()).orElse(null);
            if (org == null) continue;
            long memberCount = organizationMemberRepository.countByOrganizationId(org.getId());
            long workspaceCount = workspaceRepository.findByOrganizationId(org.getId()).size();
            OrganizationResponse response = OrganizationResponse.builder()
                    .id(org.getId())
                    .name(org.getName())
                    .slug(org.getSlug())
                    .description(org.getDescription())
                    .avatar(org.getAvatar())
                    .website(org.getWebsite())
                    .ownerId(org.getOwnerId())
                    .isOwner(org.getOwnerId().equals(userId))
                    .isDefault(member.getIsDefault())
                    .userRole(member.getRole())
                    .createdAt(org.getCreatedAt())
                    .updatedAt(org.getUpdatedAt())
                    ._count(OrganizationResponse.CountDto.builder()
                            .members(memberCount)
                            .workspaces(workspaceCount)
                            .build())
                    .build();
            responses.add(response);
        }
        return responses;
    }
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, String userId) {
        // 1. Xử lý tạo Slug (đường dẫn URL thân thiện cho tổ chức)
        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getName());
        } else if (organizationRepository.existsBySlug(slug)) {
            slug = generateSlug(slug);
        }

        // 2. Tạo và lưu Organization mới vào Database
        Organization organization = Organization.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .website(request.getWebsite())
                .ownerId(userId)
                .createdBy(userId)
                .archive(false)
                .build();
        Organization savedOrg = organizationRepository.save(organization);

        // 3. Tự động thêm người tạo vào bảng organization_members với quyền cao nhất (OWNER)
        OrganizationMember member = OrganizationMember.builder()
                .organizationId(savedOrg.getId())
                .userId(userId)
                .role(Role.OWNER)
                .isDefault(true)
                .createdBy(userId)
                .build();
        organizationMemberRepository.save(member);

        // 4. Nếu user chưa có tổ chức mặc định, cập nhật defaultOrganizationId cho user
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getDefaultOrganizationId() == null) {
                user.setDefaultOrganizationId(savedOrg.getId());
                userRepository.save(user);
            }
        });

        // 5. Nếu người dùng có chọn tạo sẵn một Workspace mặc định
        long workspaceCount = 0;
        if (request.getDefaultWorkspace() != null && request.getDefaultWorkspace().get("name") != null) {
            String wsName = request.getDefaultWorkspace().get("name").toString().trim();
            if (!wsName.isBlank()) {
                Workspace defaultWs = Workspace.builder()
                        .name(wsName)
                        .slug(generateSlug(wsName))
                        .organizationId(savedOrg.getId())
                        .createdBy(userId)
                        .build();
                workspaceRepository.save(defaultWs);
                workspaceCount = 1;
            }
        }

        // 6. Đóng gói và trả về OrganizationResponse cho Frontend
        return OrganizationResponse.builder()
                .id(savedOrg.getId())
                .name(savedOrg.getName())
                .slug(savedOrg.getSlug())
                .description(savedOrg.getDescription())
                .avatar(savedOrg.getAvatar())
                .website(savedOrg.getWebsite())
                .ownerId(userId)
                .isOwner(true)
                .isDefault(true)
                .userRole(Role.OWNER)
                .createdAt(savedOrg.getCreatedAt())
                .updatedAt(savedOrg.getUpdatedAt())
                ._count(OrganizationResponse.CountDto.builder()
                        .members(1)
                        .workspaces(workspaceCount)
                        .build())
                .build();
    }
}

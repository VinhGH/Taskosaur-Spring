package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.workspace.AddMemberRequest;
import com.taskosaur.taskosaur.dto.workspace.CreateWorkspaceRequest;
import com.taskosaur.taskosaur.dto.workspace.UpdateWorkspaceRequest;
import com.taskosaur.taskosaur.enums.WorkspaceRole;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.models.WorkspaceMember;
import com.taskosaur.taskosaur.repositories.WorkspaceMemberRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    // Helper tạo slug từ name
    private String generateSlug(String input) {
        String nowhitespace = Pattern.compile("[\\s]").matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = Pattern.compile("[^\\w-]").matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    // 1. Tạo mới Workspace (Chuẩn logic NestJS gốc)
    @Transactional
    public Workspace createWorkspace(CreateWorkspaceRequest request, String userId) {
        String parentPath = "";

        // Kiểm tra workspace cha nếu có (Hierarchy Tree)
        if (request.getParentWorkspaceId() != null && !request.getParentWorkspaceId().isBlank()) {
            Workspace parentWorkspace = workspaceRepository.findById(request.getParentWorkspaceId())
                    .orElseThrow(() -> new RuntimeException("Parent workspace not found"));

            if (!parentWorkspace.getOrganizationId().equals(request.getOrganizationId())) {
                throw new RuntimeException("Parent workspace must belong to the same organization");
            }

            if (parentWorkspace.isArchive()) {
                throw new RuntimeException("Cannot create a child workspace under an archived parent");
            }

            parentPath = (parentWorkspace.getPath() != null && !parentWorkspace.getPath().isBlank())
                    ? parentWorkspace.getPath()
                    : "/" + parentWorkspace.getId();
        }

        // Sinh slug duy nhất
        String baseSlug = generateSlug(request.getName());
        String uniqueSlug = baseSlug;
        int counter = 1;
        while (workspaceRepository.existsBySlug(uniqueSlug)) {
            uniqueSlug = baseSlug + "-" + counter++;
        }

        // Tạo và lưu Workspace
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .slug(uniqueSlug)
                .description(request.getDescription())
                .color(request.getColor())
                .organizationId(request.getOrganizationId())
                .parentWorkspaceId(request.getParentWorkspaceId())
                .path("")
                .createdBy(userId)
                .archive(false)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Cập nhật đường dẫn cây thư mục: /parent-id/child-id
        String workspacePath = parentPath.isEmpty() ? "/" + savedWorkspace.getId() : parentPath + "/" + savedWorkspace.getId();
        savedWorkspace.setPath(workspacePath);
        workspaceRepository.save(savedWorkspace);

        // Tự động gán người tạo làm OWNER
        if (userId != null && !userId.isBlank()) {
            WorkspaceMember ownerMember = WorkspaceMember.builder()
                    .workspaceId(savedWorkspace.getId())
                    .userId(userId)
                    .role(WorkspaceRole.OWNER)
                    .build();
            workspaceMemberRepository.save(ownerMember);
        }

        return savedWorkspace;
    }

    // 2. Lấy danh sách Workspace theo Organization
    public List<Workspace> getWorkspacesByOrganization(String organizationId) {
        return workspaceRepository.findByOrganizationId(organizationId);
    }

    // 3. Lấy chi tiết Workspace theo ID
    public Workspace getWorkspaceById(String id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workspace not found with id: " + id));
    }

    // 4. Cập nhật Workspace
    @Transactional
    public Workspace updateWorkspace(String id, UpdateWorkspaceRequest request) {
        Workspace workspace = getWorkspaceById(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            workspace.setName(request.getName());
        }
        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription());
        }
        if (request.getColor() != null) {
            workspace.setColor(request.getColor());
        }

        return workspaceRepository.save(workspace);
    }

    // 5. Xóa mềm (Archive) hoặc Xóa cứng Workspace
    @Transactional
    public void deleteWorkspace(String id) {
        Workspace workspace = getWorkspaceById(id);
        workspaceRepository.delete(workspace);
    }

    // 6. Thêm thành viên vào Workspace
    @Transactional
    public WorkspaceMember addMember(AddMemberRequest request) {
        if (!workspaceRepository.existsById(request.getWorkspaceId())) {
            throw new RuntimeException("Workspace not found");
        }

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(request.getWorkspaceId(), request.getUserId())) {
            throw new RuntimeException("User is already a member of this workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(request.getWorkspaceId())
                .userId(request.getUserId())
                .role(request.getRole())
                .build();

        return workspaceMemberRepository.save(member);
    }

    // 7. Lấy danh sách thành viên trong Workspace
    public List<WorkspaceMember> getMembers(String workspaceId) {
        return workspaceMemberRepository.findByWorkspaceId(workspaceId);
    }

    // 8. Xóa thành viên khỏi Workspace
    @Transactional
    public void removeMember(String memberId) {
        workspaceMemberRepository.deleteById(memberId);
    }
}
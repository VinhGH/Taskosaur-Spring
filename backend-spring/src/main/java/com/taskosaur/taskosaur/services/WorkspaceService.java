package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.workspace.AddMemberRequest;
import com.taskosaur.taskosaur.dto.workspace.CreateWorkspaceRequest;
import com.taskosaur.taskosaur.dto.workspace.UpdateWorkspaceRequest;
import com.taskosaur.taskosaur.enums.WorkspaceRole;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
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

    private static final String PATH_SEPARATOR = "/";
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("[\\s]");
    private static final Pattern NON_ALPHANUMERIC_PATTERN = Pattern.compile("[^\\w-]");

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    private String generateSlug(String input) {
        String nowhitespace = WHITESPACE_PATTERN.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NON_ALPHANUMERIC_PATTERN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    @Transactional
    public Workspace createWorkspace(CreateWorkspaceRequest request, String userId) {
        String parentPath = "";

        if (request.getParentWorkspaceId() != null && !request.getParentWorkspaceId().isBlank()) {
            Workspace parentWorkspace = workspaceRepository.findById(request.getParentWorkspaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent workspace not found"));

            if (!parentWorkspace.getOrganizationId().equals(request.getOrganizationId())) {
                throw new BadRequestException("Parent workspace must belong to the same organization");
            }

            if (parentWorkspace.isArchive()) {
                throw new BadRequestException("Cannot create a child workspace under an archived parent");
            }

            parentPath = (parentWorkspace.getPath() != null && !parentWorkspace.getPath().isBlank())
                    ? parentWorkspace.getPath()
                    : PATH_SEPARATOR + parentWorkspace.getId();
        }

        String baseSlug = generateSlug(request.getName());
        String uniqueSlug = baseSlug;
        int counter = 1;
        while (workspaceRepository.existsBySlug(uniqueSlug)) {
            uniqueSlug = baseSlug + "-" + counter++;
        }

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

        String workspacePath = parentPath.isEmpty()
                ? PATH_SEPARATOR + savedWorkspace.getId()
                : parentPath + PATH_SEPARATOR + savedWorkspace.getId();
        savedWorkspace.setPath(workspacePath);
        workspaceRepository.save(savedWorkspace);

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

    public List<Workspace> getWorkspacesByOrganization(String organizationId) {
        return workspaceRepository.findByOrganizationId(organizationId);
    }

    public Workspace getWorkspaceById(String id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + id));
    }

    public Workspace getWorkspaceBySlug(String organizationId, String slug) {
        return workspaceRepository.findByOrganizationIdAndSlug(organizationId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with slug: " + slug));
    }


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

    @Transactional
    public void deleteWorkspace(String id) {
        Workspace workspace = getWorkspaceById(id);
        workspaceRepository.delete(workspace);
    }

    @Transactional
    public WorkspaceMember addMember(AddMemberRequest request) {
        if (!workspaceRepository.existsById(request.getWorkspaceId())) {
            throw new ResourceNotFoundException("Workspace not found");
        }

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(request.getWorkspaceId(), request.getUserId())) {
            throw new ConflictException("User is already a member of this workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(request.getWorkspaceId())
                .userId(request.getUserId())
                .role(request.getRole())
                .build();

        return workspaceMemberRepository.save(member);
    }

    public List<WorkspaceMember> getMembers(String workspaceId) {
        return workspaceMemberRepository.findByWorkspaceId(workspaceId);
    }

    @Transactional
    public void removeMember(String memberId) {
        workspaceMemberRepository.deleteById(memberId);
    }
}
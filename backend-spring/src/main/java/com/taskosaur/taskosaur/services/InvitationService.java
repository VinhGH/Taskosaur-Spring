package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.InvitationStatus;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.WorkspaceRole;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    // ─── Create Invitation ────────────────────────────────────────────────────

    public Map<String, Object> createInvitation(
            String inviterId,
            String inviteeEmail,
            String organizationId,
            String workspaceId,
            String projectId,
            String role
    ) {
        // Validate at least one entity
        if (organizationId == null && workspaceId == null && projectId == null) {
            throw new BadRequestException("At least one entity (organization, workspace, or project) is required");
        }

        // Check for duplicate pending invitation
        if (projectId != null && invitationRepository.existsByInviteeEmailAndProjectIdAndStatus(
                inviteeEmail, projectId, InvitationStatus.PENDING)) {
            throw new ConflictException("A pending invitation already exists for this email in this project");
        }
        if (workspaceId != null && invitationRepository.existsByInviteeEmailAndWorkspaceIdAndStatus(
                inviteeEmail, workspaceId, InvitationStatus.PENDING)) {
            throw new ConflictException("A pending invitation already exists for this email in this workspace");
        }
        if (organizationId != null && invitationRepository.existsByInviteeEmailAndOrganizationIdAndStatus(
                inviteeEmail, organizationId, InvitationStatus.PENDING)) {
            throw new ConflictException("A pending invitation already exists for this email in this organization");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

        Invitation invitation = Invitation.builder()
                .inviterId(inviterId)
                .inviteeEmail(inviteeEmail)
                .organizationId(organizationId)
                .workspaceId(workspaceId)
                .projectId(projectId)
                .role(role != null ? role : "MEMBER")
                .status(InvitationStatus.PENDING)
                .token(token)
                .expiresAt(expiresAt)
                .build();

        Invitation saved = invitationRepository.save(invitation);
        dispatchInvitationEmail(saved);

        return buildInvitationMap(saved);
    }

    // ─── Get invitations for current user (by email) ──────────────────────────

    public List<Map<String, Object>> getUserInvitations(String userEmail, String status, String entityType, String entityId) {
        List<Invitation> invitations;

        if (status != null && !status.isBlank()) {
            try {
                InvitationStatus st = InvitationStatus.valueOf(status.toUpperCase());
                invitations = invitationRepository.findByInviteeEmailAndStatus(userEmail, st);
            } catch (IllegalArgumentException e) {
                invitations = invitationRepository.findByInviteeEmail(userEmail);
            }
        } else {
            invitations = invitationRepository.findByInviteeEmail(userEmail);
        }

        // Filter by entity if provided
        if (entityType != null && entityId != null) {
            invitations = invitations.stream().filter(inv -> {
                String type = entityType.toLowerCase();
                return switch (type) {
                    case "project" -> entityId.equals(inv.getProjectId());
                    case "workspace" -> entityId.equals(inv.getWorkspaceId());
                    case "organization" -> entityId.equals(inv.getOrganizationId());
                    default -> true;
                };
            }).toList();
        }

        return invitations.stream().map(this::buildInvitationMap).toList();
    }

    // ─── Get invitations for an entity (project/workspace/org) ────────────────

    public List<Map<String, Object>> getEntityInvitations(String entityType, String entityId, String status) {
        List<Invitation> list;

        InvitationStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = InvitationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid status
            }
        }

        switch (entityType.toLowerCase()) {
            case "project":
                list = st != null
                        ? invitationRepository.findByProjectIdAndStatus(entityId, st)
                        : invitationRepository.findByProjectId(entityId);
                break;
            case "workspace":
                list = st != null
                        ? invitationRepository.findByWorkspaceIdAndStatus(entityId, st)
                        : invitationRepository.findByWorkspaceId(entityId);
                break;
            case "organization":
                list = st != null
                        ? invitationRepository.findByOrganizationIdAndStatus(entityId, st)
                        : invitationRepository.findByOrganizationId(entityId);
                break;
            default:
                throw new BadRequestException("Invalid entityType: " + entityType);
        }

        return list.stream().map(this::buildInvitationMap).toList();
    }

    // ─── Verify invitation token ──────────────────────────────────────────────

    public Map<String, Object> verifyInvitation(String token) {
        Invitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid token"));

        if (inv.getStatus() != InvitationStatus.PENDING) {
            return Map.of(
                    "isValid", false,
                    "message", "This invitation has already been " + inv.getStatus().name().toLowerCase()
            );
        }

        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(inv);
            return Map.of(
                    "isValid", false,
                    "message", "This invitation has expired"
            );
        }

        boolean inviteeExists = userRepository.findByEmail(inv.getInviteeEmail()).isPresent();

        Map<String, Object> response = new HashMap<>();
        response.put("isValid", true);
        response.put("inviteeExists", inviteeExists);
        response.put("invitation", Map.of(
                "id", inv.getId(),
                "email", inv.getInviteeEmail(),
                "role", inv.getRole(),
                "projectId", inv.getProjectId() != null ? inv.getProjectId() : "",
                "workspaceId", inv.getWorkspaceId() != null ? inv.getWorkspaceId() : "",
                "organizationId", inv.getOrganizationId() != null ? inv.getOrganizationId() : "",
                "expiresAt", inv.getExpiresAt() != null ? inv.getExpiresAt().toString() : ""
        ));

        return response;
    }

    // ─── Accept invitation ────────────────────────────────────────────────────

    public Map<String, Object> acceptInvitation(String token, String currentUserId) {
        Invitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid token"));

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending (status: " + inv.getStatus() + ")");
        }

        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(inv);
            throw new BadRequestException("Invitation has expired");
        }

        // Add user as member to the target entity
        if (inv.getProjectId() != null) {
            if (!projectMemberRepository.existsByProjectIdAndUserId(inv.getProjectId(), currentUserId)) {
                Role projectRole = Role.MEMBER;
                try {
                    projectRole = Role.valueOf(inv.getRole());
                } catch (IllegalArgumentException ignored) {
                    // Default to MEMBER
                }
                ProjectMember pm = ProjectMember.builder()
                        .projectId(inv.getProjectId())
                        .userId(currentUserId)
                        .role(projectRole)
                        .createdBy(inv.getInviterId())
                        .build();
                projectMemberRepository.save(pm);
            }
        }

        if (inv.getWorkspaceId() != null) {
            if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(inv.getWorkspaceId(), currentUserId)) {
                WorkspaceRole wsRole = WorkspaceRole.MEMBER;
                try {
                    wsRole = WorkspaceRole.valueOf(inv.getRole());
                } catch (IllegalArgumentException ignored) {
                    // Fall back to MEMBER
                }
                WorkspaceMember wm = WorkspaceMember.builder()
                        .workspaceId(inv.getWorkspaceId())
                        .userId(currentUserId)
                        .role(wsRole)
                        .build();
                workspaceMemberRepository.save(wm);
            }
        }

        inv.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(inv);

        return Map.of("message", "Invitation accepted successfully", "success", true);
    }

    // ─── Decline invitation ───────────────────────────────────────────────────

    public Map<String, Object> declineInvitation(String token) {
        Invitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid token"));

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is not pending");
        }

        inv.setStatus(InvitationStatus.DECLINED);
        invitationRepository.save(inv);

        return Map.of("message", "Invitation declined", "success", true);
    }

    // ─── Resend invitation ────────────────────────────────────────────────────

    public Map<String, Object> resendInvitation(String invitationId) {
        Invitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        if (inv.getStatus() != InvitationStatus.PENDING && inv.getStatus() != InvitationStatus.EXPIRED) {
            throw new BadRequestException("Can only resend PENDING or EXPIRED invitations");
        }

        // Refresh token and expiry
        inv.setToken(UUID.randomUUID().toString().replace("-", ""));
        inv.setStatus(InvitationStatus.PENDING);
        inv.setExpiresAt(LocalDateTime.now().plusDays(7));
        Invitation saved = invitationRepository.save(inv);

        dispatchInvitationEmail(saved);

        return Map.of(
                "message", "Invitation resent successfully",
                "invitation", buildInvitationMap(saved),
                "emailSent", true
        );
    }

    // ─── Delete invitation ────────────────────────────────────────────────────

    public Map<String, Object> deleteInvitation(String invitationId) {
        if (!invitationRepository.existsById(invitationId)) {
            throw new ResourceNotFoundException("Invitation not found");
        }
        invitationRepository.deleteById(invitationId);
        return Map.of("message", "Invitation deleted successfully");
    }

    // ─── Email Dispatcher ─────────────────────────────────────────────────────

    private void dispatchInvitationEmail(Invitation invitation) {
        try {
            String inviterName = userRepository.findById(invitation.getInviterId())
                    .map(u -> (u.getFirstName() + " " + u.getLastName()).trim())
                    .filter(s -> !s.isEmpty())
                    .orElse("A team member");

            String entityName = "Taskosaur";
            String entityType = "organization";

            if (invitation.getProjectId() != null) {
                entityName = projectRepository.findById(invitation.getProjectId())
                        .map(Project::getName)
                        .orElse("Project");
                entityType = "project";
            } else if (invitation.getWorkspaceId() != null) {
                entityName = workspaceRepository.findById(invitation.getWorkspaceId())
                        .map(Workspace::getName)
                        .orElse("Workspace");
                entityType = "workspace";
            } else if (invitation.getOrganizationId() != null) {
                entityName = organizationRepository.findById(invitation.getOrganizationId())
                        .map(Organization::getName)
                        .orElse("Organization");
                entityType = "organization";
            }

            String invitationUrl = frontendUrl + "/invite?token=" + invitation.getToken();

            emailService.sendInvitationEmail(
                    invitation.getInviteeEmail(),
                    inviterName,
                    entityName,
                    entityType,
                    invitation.getRole(),
                    invitationUrl,
                    invitation.getExpiresAt()
            );
        } catch (Exception e) {
            log.error("Failed to trigger invitation email: {}", e.getMessage(), e);
        }
    }

    // ─── Build response map ───────────────────────────────────────────────────

    private Map<String, Object> buildInvitationMap(Invitation inv) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", inv.getId());
        map.put("inviterId", inv.getInviterId());
        map.put("inviteeEmail", inv.getInviteeEmail());
        map.put("organizationId", inv.getOrganizationId());
        map.put("workspaceId", inv.getWorkspaceId());
        map.put("projectId", inv.getProjectId());
        map.put("role", inv.getRole());
        map.put("status", inv.getStatus().name());
        map.put("token", inv.getToken());
        map.put("expiresAt", inv.getExpiresAt());
        map.put("createdAt", inv.getCreatedAt());
        map.put("updatedAt", inv.getUpdatedAt());

        // Enrich with project info if applicable
        if (inv.getProjectId() != null) {
            projectRepository.findById(inv.getProjectId()).ifPresent(p ->
                map.put("project", Map.of("id", p.getId(), "name", p.getName(), "slug", p.getSlug()))
            );
        }
        if (inv.getWorkspaceId() != null) {
            workspaceRepository.findById(inv.getWorkspaceId()).ifPresent(w ->
                map.put("workspace", Map.of("id", w.getId(), "name", w.getName(), "slug", w.getSlug()))
            );
        }

        return map;
    }
}

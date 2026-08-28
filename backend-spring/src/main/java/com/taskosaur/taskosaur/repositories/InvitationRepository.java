package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.InvitationStatus;
import com.taskosaur.taskosaur.models.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, String> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByInviteeEmail(String email);
    List<Invitation> findByInviteeEmailAndStatus(String email, InvitationStatus status);
    List<Invitation> findByProjectId(String projectId);
    List<Invitation> findByProjectIdAndStatus(String projectId, InvitationStatus status);
    List<Invitation> findByWorkspaceId(String workspaceId);
    List<Invitation> findByWorkspaceIdAndStatus(String workspaceId, InvitationStatus status);
    List<Invitation> findByOrganizationId(String organizationId);
    List<Invitation> findByOrganizationIdAndStatus(String organizationId, InvitationStatus status);

    boolean existsByInviteeEmailAndProjectIdAndStatus(String email, String projectId, InvitationStatus status);
    boolean existsByInviteeEmailAndWorkspaceIdAndStatus(String email, String workspaceId, InvitationStatus status);
    boolean existsByInviteeEmailAndOrganizationIdAndStatus(String email, String orgId, InvitationStatus status);
}

package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, String> {
    List<Workspace> findByOrganizationId(String organizationId);
    Optional<Workspace> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Workspace> findByOrganizationIdAndSlug(String organizationId, String slug);
    boolean existsByOrganizationIdAndSlug(String organizationId, String slug);
}
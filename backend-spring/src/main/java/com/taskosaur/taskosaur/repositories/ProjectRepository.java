package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByWorkspaceId(String workspaceId);
    Optional<Project> findByWorkspaceIdAndSlug(String workspaceId, String slug);
    boolean existsByWorkspaceIdAndSlug(String workspaceId, String slug);
    boolean existsByTaskPrefix(String taskPrefix);
}
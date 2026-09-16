package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.GithubSync;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GithubSyncRepository extends JpaRepository<GithubSync, String> {
    Optional<GithubSync> findByProjectId(String projectId);
    Optional<GithubSync> findByWorkspaceId(String workspaceId);
    void deleteByProjectId(String projectId);
}

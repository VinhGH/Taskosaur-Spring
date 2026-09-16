package com.taskosaur.taskosaur.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_syncs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GithubSync {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "project_id", unique = true)
    private String projectId;

    @Column(name = "workspace_id")
    private String workspaceId;

    @Column(name = "github_repo_owner", nullable = false)
    private String githubRepoOwner;

    @Column(name = "github_repo_name", nullable = false)
    private String githubRepoName;

    @Column(name = "github_repo_id")
    private String githubRepoId;

    @Column(name = "github_token", nullable = false)
    private String githubToken;

    @Column(name = "sync_enabled", nullable = false)
    @Builder.Default
    private Boolean syncEnabled = true;

    @Column(name = "sync_interval", nullable = false)
    @Builder.Default
    private Integer syncInterval = 15;

    @Column(name = "sync_direction", nullable = false)
    @Builder.Default
    private String syncDirection = "ONE_WAY_IMPORT";

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "last_sync_status")
    private String lastSyncStatus;

    @Column(name = "last_sync_error", columnDefinition = "TEXT")
    private String lastSyncError;

    @Column(name = "issues_imported", nullable = false)
    @Builder.Default
    private Integer issuesImported = 0;

    @Column(name = "status_mappings", columnDefinition = "TEXT")
    private String statusMappings;

    @Column(name = "created_by_id")
    private String createdById;

    @Column(name = "updated_by_id")
    private String updatedById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

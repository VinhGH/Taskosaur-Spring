package com.taskosaur.taskosaur.dto.github;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GithubSyncStatusResponse {
    private String id;
    private String projectId;
    private String workspaceId;
    private String githubRepoOwner;
    private String githubRepoName;
    private String githubRepoId;
    private Boolean syncEnabled;
    private Integer syncInterval;
    private String syncDirection;
    private LocalDateTime lastSyncAt;
    private String lastSyncStatus;
    private String lastSyncError;
    private Integer issuesImported;
    private Map<String, String> statusMappings;
    private Boolean hasToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

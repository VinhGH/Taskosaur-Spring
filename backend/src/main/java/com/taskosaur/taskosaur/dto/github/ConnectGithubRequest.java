package com.taskosaur.taskosaur.dto.github;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectGithubRequest {
    private String projectId;
    private String workspaceId;
    private String repoOwner;
    private String repoName;
    private String repoId;
    private String token;
    private Integer syncInterval;
    private String syncDirection;
    private Map<String, String> statusMappings;
}

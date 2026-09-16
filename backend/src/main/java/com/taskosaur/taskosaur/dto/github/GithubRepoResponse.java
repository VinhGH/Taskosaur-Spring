package com.taskosaur.taskosaur.dto.github;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GithubRepoResponse {
    private Long id;
    private String name;
    private String fullName;
    private String owner;
    private String description;
    private String htmlUrl;
    private String defaultBranch;
    private Boolean isPrivate;
    private Integer openIssuesCount;
}

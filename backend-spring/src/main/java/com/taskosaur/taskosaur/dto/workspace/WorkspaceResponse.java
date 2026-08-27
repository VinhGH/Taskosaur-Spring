package com.taskosaur.taskosaur.dto.workspace;

import com.taskosaur.taskosaur.dto.organization.OrganizationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceResponse {
    private String id;
    private String name;
    private String description;
    private String slug;
    private String color;
    private String organizationId;
    private String parentWorkspaceId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @com.fasterxml.jackson.annotation.JsonProperty("_count")
    private CountDto count;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CountDto {
        private long members;
        private long projects;
        private long tasks;
    }

}

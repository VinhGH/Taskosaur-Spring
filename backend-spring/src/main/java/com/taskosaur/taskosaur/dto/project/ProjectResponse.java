package com.taskosaur.taskosaur.dto.project;

import com.taskosaur.taskosaur.enums.ProjectPriority;
import com.taskosaur.taskosaur.enums.ProjectStatus;
import com.taskosaur.taskosaur.enums.ProjectVisibility;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private String id;
    private String name;
    private String slug;
    private String taskPrefix;
    private String description;
    private String avatar;
    private String color;
    private ProjectStatus status;
    private ProjectPriority priority;
    private ProjectVisibility visibility;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String workspaceId;
    private String workflowId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonProperty("_count")
    private CountDto count;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CountDto {
        private long tasks;
        private long members;
        private long sprints;
    }
}

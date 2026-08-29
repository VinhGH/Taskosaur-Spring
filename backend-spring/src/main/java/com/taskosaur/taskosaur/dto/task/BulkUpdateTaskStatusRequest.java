package com.taskosaur.taskosaur.dto.task;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkUpdateTaskStatusRequest {
    private List<String> taskIds;
    private String projectId;
    private Boolean all;
    private List<String> excludedIds;
    private String statusId;
    private String search;
    private String statuses;
    private String priorities;
    private String types;
    private String assignees;
    private String reporters;
    private String sprintId;
    private String organizationId;
    private String workspaceId;
}

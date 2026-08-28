package com.taskosaur.taskosaur.dto.task;

import lombok.Builder;

@Builder
public record TaskGroupQuery(
        String organizationId,
        String workspaceId,
        String projectId,
        String sprintId,
        String groupBy,
        String priorities,
        String statuses,
        String types,
        String search,
        int page,
        int limitPerGroup
) {
}

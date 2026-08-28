package com.taskosaur.taskosaur.dto.task;

import lombok.Builder;

@Builder
public record TaskFilterQuery(
        String organizationId,
        String workspaceId,
        String projectId,
        String sprintId,
        String parentTaskId,
        String priorities,
        String statuses,
        String types,
        String search,
        String sortBy,
        String sortOrder,
        String from,
        String to,
        String dateField,
        int page,
        int limit
) {
}

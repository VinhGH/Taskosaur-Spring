package com.taskosaur.taskosaur.events;

import com.taskosaur.taskosaur.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogEvent {

    private String userId;
    private String userName;
    private ActivityType type;
    private String description;
    private String entityType;
    private String entityId;
    private String oldValue;
    private String newValue;
    private String organizationId;
    private String projectId;
    private String workspaceId;
}

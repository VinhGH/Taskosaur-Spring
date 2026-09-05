package com.taskosaur.taskosaur.dto.activity;

import com.taskosaur.taskosaur.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogActivityParams {
    private ActivityType type;
    private String description;
    private String entityType;
    private String entityId;
    private String oldValue;
    private String newValue;
    private String userId;
    private String organizationId;
}

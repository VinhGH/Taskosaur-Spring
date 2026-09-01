package com.taskosaur.taskosaur.dto.activity;

import com.taskosaur.taskosaur.enums.ActivityType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {

    private String id;
    private ActivityType type;
    private String description;
    private String entityType;
    private String entityId;
    private String oldValue;
    private String newValue;
    private String userId;
    private UserSummaryDto user;
    private String organizationId;
    private String taskSlug;
    private String projectSlug;
    private String workspaceSlug;
    private String sprintSlug;
    private LocalDateTime createdAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class UserSummaryDto {
        private String id;
        private String name;
        private String firstName;
        private String lastName;
        private String email;
        private String avatar;
    }
}

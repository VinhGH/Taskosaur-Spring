package com.taskosaur.taskosaur.dto.timeentry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeEntryResponse {

    private String id;
    private String description;
    private Integer timeSpent;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime date;
    private String taskId;
    private String userId;
    private TaskSummaryDto task;
    private UserSummaryDto user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummaryDto {
        private String id;
        private String title;
        private String slug;
        private Integer taskNumber;
        private String projectId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummaryDto {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String avatar;
    }
}

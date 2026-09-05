package com.taskosaur.taskosaur.dto.timeentry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSpentSummaryResponse {

    private Integer totalTimeSpent; // in minutes
    private Double totalTimeSpentHours; // in hours
    private Integer totalEntries;
    private List<TaskTimeSummary> taskSummary;
    private List<UserTimeSummary> userSummary;
    private List<TimeEntryResponse> entries;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskTimeSummary {
        private String taskId;
        private String taskTitle;
        private String taskSlug;
        private Integer totalMinutes;
        private Double totalHours;
        private Integer entryCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserTimeSummary {
        private String userId;
        private String userName;
        private String userAvatar;
        private Integer totalMinutes;
        private Double totalHours;
        private Integer entryCount;
    }
}

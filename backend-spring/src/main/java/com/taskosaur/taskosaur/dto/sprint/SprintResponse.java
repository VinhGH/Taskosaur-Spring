package com.taskosaur.taskosaur.dto.sprint;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taskosaur.taskosaur.enums.SprintStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintResponse {
    private String id;
    private String name;
    private String slug;
    private String goal;
    private SprintStatus status;
    private Boolean isDefault;
    private Boolean archive;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String projectId;
    private String createdBy;
    private String updatedBy;
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
    }
}

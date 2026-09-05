package com.taskosaur.taskosaur.dto.timeentry;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTimeEntryRequest {

    @NotNull(message = "Task ID is required")
    private String taskId;

    private String description;

    private Integer timeSpent;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime date;
}

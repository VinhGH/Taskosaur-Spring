package com.taskosaur.taskosaur.dto.timeentry;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StartTimerRequest {

    @NotNull(message = "Task ID is required")
    private String taskId;

    private String description;
}

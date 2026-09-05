package com.taskosaur.taskosaur.dto.timeentry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StopTimerRequest {

    private String taskId;

    private String description;
}

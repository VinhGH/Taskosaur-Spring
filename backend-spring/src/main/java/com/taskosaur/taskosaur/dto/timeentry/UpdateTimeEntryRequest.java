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
public class UpdateTimeEntryRequest {

    private String description;

    private Integer timeSpent;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime date;
}

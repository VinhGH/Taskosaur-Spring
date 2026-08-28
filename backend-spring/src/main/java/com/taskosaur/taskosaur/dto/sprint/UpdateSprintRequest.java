package com.taskosaur.taskosaur.dto.sprint;

import com.taskosaur.taskosaur.enums.SprintStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSprintRequest {
    private String name;
    private String goal;
    private SprintStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean archive;
}

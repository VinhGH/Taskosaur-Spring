package com.taskosaur.taskosaur.dto.label;

import com.taskosaur.taskosaur.models.Label;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskLabelResponse {
    private String taskId;
    private String labelId;
    private Label label;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

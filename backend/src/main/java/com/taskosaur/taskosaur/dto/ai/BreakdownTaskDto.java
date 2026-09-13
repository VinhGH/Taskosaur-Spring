package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BreakdownTaskDto {
    private String taskId;
    private String projectId;
    private String title;
    private String description;
    private String userPrompt;
    private Integer count;
}

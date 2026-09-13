package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratedSubtaskDto {
    private String title;
    private String description;
    private String priority;
    private Integer estimatedPoints;
}

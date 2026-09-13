package com.taskosaur.taskosaur.dto.ai;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BreakdownTaskResponseDto {
    private boolean success;
    private String error;
    private List<GeneratedSubtaskDto> subtasks;
}

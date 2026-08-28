package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateDescriptionResponseDto {
    private String description;
    private boolean success;
    private String error;
}

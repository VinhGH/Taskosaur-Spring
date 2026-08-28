package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateDescriptionDto {
    @NotBlank(message = "Title is required")
    private String title;

    private String taskType;
}

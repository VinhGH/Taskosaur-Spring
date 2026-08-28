package com.taskosaur.taskosaur.dto.label;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateLabelRequest {

    @NotBlank(message = "Label name cannot be empty")
    private String name;

    @NotBlank(message = "Label color cannot be empty")
    private String color;

    private String description;

    @NotBlank(message = "Project ID cannot be empty")
    private String projectId;
}

package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestConnectionDto {
    private String apiKey;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "API URL is required")
    private String apiUrl;
}

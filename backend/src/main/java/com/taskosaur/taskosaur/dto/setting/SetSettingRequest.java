package com.taskosaur.taskosaur.dto.setting;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetSettingRequest {
    @NotBlank(message = "Key is required")
    private String key;

    private String value;
    private String description;

    @Builder.Default
    private String category = "general";

    @Builder.Default
    private Boolean isEncrypted = false;
}

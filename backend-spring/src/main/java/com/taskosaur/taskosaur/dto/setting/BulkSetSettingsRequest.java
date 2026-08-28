package com.taskosaur.taskosaur.dto.setting;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkSetSettingsRequest {
    @NotEmpty(message = "Settings list must not be empty")
    @Valid
    private List<SetSettingRequest> settings;
}

package com.taskosaur.taskosaur.dto.setting;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingResponse {
    private String id;
    private String key;
    private String value;
    private String description;
    private String category;
    private Boolean isEncrypted;
}

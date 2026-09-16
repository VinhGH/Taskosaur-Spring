package com.taskosaur.taskosaur.dto.github;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGithubSyncRequest {
    private Boolean syncEnabled;
    private Integer syncInterval;
    private String syncDirection;
    private Map<String, String> statusMappings;
}

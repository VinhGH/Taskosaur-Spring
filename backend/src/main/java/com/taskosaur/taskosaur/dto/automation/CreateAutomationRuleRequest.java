package com.taskosaur.taskosaur.dto.automation;

import com.taskosaur.taskosaur.enums.ActionType;
import com.taskosaur.taskosaur.enums.TriggerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAutomationRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String name;

    private String description;

    @NotNull(message = "Trigger type is required")
    private TriggerType triggerType;

    private Map<String, Object> triggerConfig;

    @NotNull(message = "Action type is required")
    private ActionType actionType;

    private Map<String, Object> actionConfig;

    @NotBlank(message = "Project ID is required")
    private String projectId;

    private String workspaceId;

    private String organizationId;
}

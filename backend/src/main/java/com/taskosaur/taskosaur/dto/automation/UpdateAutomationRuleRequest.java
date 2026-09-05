package com.taskosaur.taskosaur.dto.automation;

import com.taskosaur.taskosaur.enums.ActionType;
import com.taskosaur.taskosaur.enums.RuleStatus;
import com.taskosaur.taskosaur.enums.TriggerType;
import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAutomationRuleRequest {

    private String name;

    private String description;

    private RuleStatus status;

    private TriggerType triggerType;

    private Map<String, Object> triggerConfig;

    private ActionType actionType;

    private Map<String, Object> actionConfig;
}

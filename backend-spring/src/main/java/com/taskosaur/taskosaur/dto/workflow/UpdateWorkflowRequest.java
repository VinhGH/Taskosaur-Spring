package com.taskosaur.taskosaur.dto.workflow;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkflowRequest {

    private String name;

    private String description;

    private Boolean isDefault;

    private List<CreateWorkflowRequest.WorkflowStageItem> stages;
}

package com.taskosaur.taskosaur.dto.workflow;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkflowRequest {

    @NotBlank(message = "Tên workflow không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "organizationId không được để trống")
    private String organizationId;

    private Boolean isDefault;

    private List<WorkflowStageItem> stages;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowStageItem {
        private String name;
        private String color;
        private String category;
        private Integer position;
    }
}

package com.taskosaur.taskosaur.dto.taskstatus;

import com.taskosaur.taskosaur.enums.StatusCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskStatusRequest {
    @NotBlank(message = "Tên trạng thái không được để trống")
    private String name;
    private String description;
    private String color;
    private String icon;
    private StatusCategory category;
    private Integer position;
    private String workflowId;
    private String projectId;
}

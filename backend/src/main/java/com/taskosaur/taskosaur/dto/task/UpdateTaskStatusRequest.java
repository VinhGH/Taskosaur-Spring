package com.taskosaur.taskosaur.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskStatusRequest {

    @NotBlank(message = "statusId không được để trống")
    private String statusId;
}

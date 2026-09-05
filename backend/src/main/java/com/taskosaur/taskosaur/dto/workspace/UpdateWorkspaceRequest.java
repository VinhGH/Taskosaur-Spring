package com.taskosaur.taskosaur.dto.workspace;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateWorkspaceRequest {

    @Size(min = 2, max = 100, message = "Tên workspace phải từ 2 đến 100 ký tự")
    private String name;

    private String description;

    private String color;
}
package com.taskosaur.taskosaur.dto.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkspaceRequest {

    @NotBlank(message = "Tên workspace không được để trống")
    @Size(min = 2, max = 100, message = "Tên workspace phải từ 2 đến 100 ký tự")
    private String name;

    private String description;

    private String color;

    @NotBlank(message = "organizationId không được để trống")
    private String organizationId;

    private String parentWorkspaceId;
}
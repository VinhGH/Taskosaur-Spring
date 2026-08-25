package com.taskosaur.taskosaur.dto.organization;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateOrganizationRequest {
    @NotBlank(message = "Tên tổ chức không được để trống")
    private String name;

    private String slug;

    private String description;

    private String website;

    private Map<String, Object> defaultWorkspace;

    private Map<String, Object> defaultProject;
}

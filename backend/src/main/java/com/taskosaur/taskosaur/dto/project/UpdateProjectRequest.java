package com.taskosaur.taskosaur.dto.project;

import com.taskosaur.taskosaur.enums.ProjectPriority;
import com.taskosaur.taskosaur.enums.ProjectStatus;
import com.taskosaur.taskosaur.enums.ProjectVisibility;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {

    @Size(min = 2, max = 100, message = "Tên dự án phải từ 2 đến 100 ký tự")
    private String name;

    private String workspaceId;

    private String slug;

    @Size(max = 8, message = "taskPrefix tối đa 8 ký tự")
    private String taskPrefix;

    private String description;

    private String avatar;

    private String color;

    private String workflowId;

    private ProjectStatus status;

    private ProjectPriority priority;

    private ProjectVisibility visibility;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private Boolean archive;
}

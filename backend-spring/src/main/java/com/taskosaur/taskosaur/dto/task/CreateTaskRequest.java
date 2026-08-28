package com.taskosaur.taskosaur.dto.task;

import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskRequest {

    @NotBlank(message = "Tiêu đề task không được để trống")
    @Size(min = 1, max = 255, message = "Tiêu đề task từ 1 đến 255 ký tự")
    private String title;

    private String description;

    @Builder.Default
    private TaskType type = TaskType.TASK;

    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @NotBlank(message = "projectId không được để trống")
    private String projectId;

    private String statusId;

    private String sprintId;

    private String parentTaskId;

    private List<String> assigneeIds;

    private Integer storyPoints;

    private LocalDateTime startDate;

    private LocalDateTime dueDate;
}

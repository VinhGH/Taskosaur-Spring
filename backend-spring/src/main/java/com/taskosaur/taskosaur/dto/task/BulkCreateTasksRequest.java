package com.taskosaur.taskosaur.dto.task;

import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkCreateTasksRequest {

    @NotBlank(message = "projectId không được để trống")
    private String projectId;

    @NotBlank(message = "statusId không được để trống")
    private String statusId;

    private String sprintId;

    private List<TaskItem> tasks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskItem {
        @NotBlank(message = "Title không được để trống")
        private String title;
        private String description;
        private TaskType type;
        private TaskPriority priority;
        private LocalDateTime dueDate;
        private LocalDateTime startDate;
        private Integer storyPoints;
    }
}

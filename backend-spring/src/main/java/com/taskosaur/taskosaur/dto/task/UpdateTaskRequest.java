package com.taskosaur.taskosaur.dto.task;

import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskRequest {
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskType type;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private Integer storyPoints;
    private String statusId;
    private String projectId;
    private String sprintId;
    private String parentTaskId;
    private List<String> assigneeIds;
}

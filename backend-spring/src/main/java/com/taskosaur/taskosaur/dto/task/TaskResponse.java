package com.taskosaur.taskosaur.dto.task;

import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import com.taskosaur.taskosaur.models.TaskStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private String id;
    private String title;
    private String description;
    private TaskType type;
    private TaskPriority priority;
    private Integer taskNumber;
    private String slug;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private Integer storyPoints;
    private String projectId;
    private String statusId;
    private String sprintId;
    private String parentTaskId;
    private TaskStatus status;
    private List<AssigneeDto> assignees;
    private List<AssigneeDto> reporters;
    private AssigneeDto reporter;
    private List<LabelDto> labels;
    private ProjectDto project;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AssigneeDto {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String avatar;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class LabelDto {
        private String id;
        private String name;
        private String color;
        private String description;
        private String projectId;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ProjectDto {
        private String id;
        private String name;
        private String slug;
        private String taskPrefix;
        private String workspaceId;
    }
}

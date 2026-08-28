package com.taskosaur.taskosaur.models;

import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "task_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskType type = TaskType.TASK;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "task_number", nullable = false)
    private Integer taskNumber;

    @Column(nullable = false)
    private String slug;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Column(name = "project_id", nullable = false)
    private String projectId;

    @Column(name = "status_id", nullable = false)
    private String statusId;

    @Column(name = "sprint_id")
    private String sprintId;

    @Column(name = "parent_task_id")
    private String parentTaskId;

    @Column(name = "created_by_id")
    private String createdBy;

    @Column(name = "updated_by_id")
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

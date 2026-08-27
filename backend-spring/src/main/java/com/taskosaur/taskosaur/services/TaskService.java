package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.CreateTaskRequest;
import com.taskosaur.taskosaur.dto.task.TaskResponse;
import com.taskosaur.taskosaur.enums.StatusCategory;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskAssignee;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ProjectRepository projectRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final UserRepository userRepository;

    public TaskResponse createTask(CreateTaskRequest request, String userId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        // 1. Xác định statusId ban đầu (nếu không truyền, lấy status mặc định của workflow)
        String statusId = request.getStatusId();
        if (statusId == null || statusId.isBlank()) {
            TaskStatus defaultStatus = taskStatusRepository.findByWorkflowIdAndIsDefaultTrue(project.getWorkflowId())
                    .orElseGet(() -> {
                        List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId());
                        return !statuses.isEmpty() ? statuses.get(0) : null;
                    });

            if (defaultStatus == null) {
                throw new ResourceNotFoundException("No task status found for project workflow");
            }
            statusId = defaultStatus.getId();
        }

        // 2. Tính taskNumber tiếp theo trong project (Monotonic: MAX + 1)
        int nextTaskNumber = taskRepository.findMaxTaskNumberByProjectId(project.getId()) + 1;

        // 3. Tạo Slug định danh (Ví dụ: MOB-1)
        String prefix = (project.getTaskPrefix() != null && !project.getTaskPrefix().isBlank())
                ? project.getTaskPrefix()
                : "TASK";
        String slug = prefix + "-" + nextTaskNumber;

        // 4. Lưu Task
        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .type(request.getType())
                .priority(request.getPriority())
                .taskNumber(nextTaskNumber)
                .slug(slug)
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .storyPoints(request.getStoryPoints())
                .projectId(project.getId())
                .statusId(statusId)
                .createdBy(userId)
                .archive(false)
                .build();

        Task savedTask = taskRepository.save(task);

        // 5. Gán Assignees (nếu có)
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            List<TaskAssignee> assignees = request.getAssigneeIds().stream()
                    .map(assigneeId -> TaskAssignee.builder()
                            .taskId(savedTask.getId())
                            .userId(assigneeId)
                            .build())
                    .toList();
            taskAssigneeRepository.saveAll(assignees);
        }

        return buildTaskResponse(savedTask);
    }

    public List<TaskResponse> getTasksByProject(String projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::buildTaskResponse)
                .toList();
    }

    public TaskResponse getTaskById(String id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return buildTaskResponse(task);
    }

    public TaskResponse getTaskBySlug(String slug) {
        Task task = taskRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with slug: " + slug));
        return buildTaskResponse(task);
    }

    public TaskResponse updateTaskStatus(String id, String statusId, String userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        TaskStatus status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskStatus not found with id: " + statusId));

        task.setStatusId(statusId);
        task.setUpdatedBy(userId);

        // Nếu chuyển sang DONE -> ghi nhận completedAt
        if (status.getCategory() == StatusCategory.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        Task updatedTask = taskRepository.save(task);
        return buildTaskResponse(updatedTask);
    }

    public void deleteTask(String id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        taskAssigneeRepository.deleteByTaskId(task.getId());
        taskRepository.delete(task);
    }

    private TaskResponse buildTaskResponse(Task task) {
        TaskStatus status = taskStatusRepository.findById(task.getStatusId()).orElse(null);

        List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(task.getId());
        List<TaskResponse.AssigneeDto> assigneeDtos = new ArrayList<>();

        for (TaskAssignee a : assignees) {
            userRepository.findById(a.getUserId()).ifPresent(u -> {
                assigneeDtos.add(TaskResponse.AssigneeDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .avatar(u.getAvatar())
                        .build());
            });
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType())
                .priority(task.getPriority())
                .taskNumber(task.getTaskNumber())
                .slug(task.getSlug())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .storyPoints(task.getStoryPoints())
                .projectId(task.getProjectId())
                .statusId(task.getStatusId())
                .status(status)
                .assignees(assigneeDtos)
                .createdBy(task.getCreatedBy())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}

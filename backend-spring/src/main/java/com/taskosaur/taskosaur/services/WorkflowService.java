package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.StatusCategory;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.models.Workflow;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import com.taskosaur.taskosaur.repositories.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final TaskStatusRepository taskStatusRepository;

    public Workflow getOrCreateDefaultWorkflow(String organizationId, String userId) {
        return workflowRepository.findByOrganizationIdAndIsDefaultTrue(organizationId)
                .orElseGet(() -> createDefaultWorkflow(organizationId, userId));
    }

    public Workflow createDefaultWorkflow(String organizationId, String userId) {
        Workflow workflow = Workflow.builder()
                .name("Default Workflow")
                .description("Standard project management workflow")
                .isDefault(true)
                .organizationId(organizationId)
                .createdBy(userId)
                .build();

        Workflow savedWorkflow = workflowRepository.save(workflow);

        // Tạo 4 trạng thái chuẩn cho bảng Kanban
        List<TaskStatus> defaultStatuses = List.of(
                TaskStatus.builder()
                        .name("To Do")
                        .color("#64748B")
                        .category(StatusCategory.TODO)
                        .position(0)
                        .isDefault(true)
                        .workflowId(savedWorkflow.getId())
                        .createdBy(userId)
                        .build(),
                TaskStatus.builder()
                        .name("In Progress")
                        .color("#3B82F6")
                        .category(StatusCategory.IN_PROGRESS)
                        .position(1)
                        .isDefault(false)
                        .workflowId(savedWorkflow.getId())
                        .createdBy(userId)
                        .build(),
                TaskStatus.builder()
                        .name("In Review")
                        .color("#F59E0B")
                        .category(StatusCategory.IN_PROGRESS)
                        .position(2)
                        .isDefault(false)
                        .workflowId(savedWorkflow.getId())
                        .createdBy(userId)
                        .build(),
                TaskStatus.builder()
                        .name("Done")
                        .color("#10B981")
                        .category(StatusCategory.DONE)
                        .position(3)
                        .isDefault(false)
                        .workflowId(savedWorkflow.getId())
                        .createdBy(userId)
                        .build()
        );

        taskStatusRepository.saveAll(defaultStatuses);
        return savedWorkflow;
    }

    public List<Workflow> getWorkflowsByOrganizationId(String organizationId) {
        return workflowRepository.findByOrganizationId(organizationId);
    }

    public java.util.Map<String, Object> toWorkflowMap(Workflow w) {
        List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(w.getId());
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", w.getId());
        map.put("name", w.getName());
        map.put("description", w.getDescription());
        map.put("isDefault", w.getIsDefault());
        map.put("organizationId", w.getOrganizationId());
        map.put("createdBy", w.getCreatedBy());
        map.put("updatedBy", w.getUpdatedBy());
        map.put("createdAt", w.getCreatedAt());
        map.put("updatedAt", w.getUpdatedAt());
        map.put("statuses", statuses);
        map.put("_count", java.util.Map.of("statuses", statuses.size(), "transitions", 0, "tasks", 0));
        return map;
    }

    public Workflow getWorkflowById(String id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
    }

    public List<TaskStatus> getWorkflowStatuses(String workflowId) {
        return taskStatusRepository.findByWorkflowIdOrderByPositionAsc(workflowId);
    }
}

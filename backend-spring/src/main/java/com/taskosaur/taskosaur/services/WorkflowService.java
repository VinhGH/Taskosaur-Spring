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

    public Workflow createWorkflow(com.taskosaur.taskosaur.dto.workflow.CreateWorkflowRequest request, String userId) {
        Workflow workflow = Workflow.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .organizationId(request.getOrganizationId())
                .createdBy(userId)
                .build();

        Workflow saved = workflowRepository.save(workflow);

        if (request.getStages() != null && !request.getStages().isEmpty()) {
            int pos = 0;
            for (var stage : request.getStages()) {
                StatusCategory category = StatusCategory.TODO;
                if (stage.getCategory() != null) {
                    try {
                        category = StatusCategory.valueOf(stage.getCategory().toUpperCase());
                    } catch (Exception ignored) {}
                }
                TaskStatus status = TaskStatus.builder()
                        .name(stage.getName() != null ? stage.getName().trim() : "Stage " + (pos + 1))
                        .color(stage.getColor() != null ? stage.getColor() : "#64748B")
                        .category(category)
                        .position(stage.getPosition() != null ? stage.getPosition() : pos)
                        .workflowId(saved.getId())
                        .createdBy(userId)
                        .build();
                taskStatusRepository.save(status);
                pos++;
            }
        } else {
            // Default statuses
            createDefaultStatusesForWorkflow(saved.getId(), userId);
        }

        return saved;
    }

    private void createDefaultStatusesForWorkflow(String workflowId, String userId) {
        List<TaskStatus> defaultStatuses = List.of(
                TaskStatus.builder().name("To Do").color("#64748B").category(StatusCategory.TODO).position(0).isDefault(true).workflowId(workflowId).createdBy(userId).build(),
                TaskStatus.builder().name("In Progress").color("#3B82F6").category(StatusCategory.IN_PROGRESS).position(1).isDefault(false).workflowId(workflowId).createdBy(userId).build(),
                TaskStatus.builder().name("In Review").color("#F59E0B").category(StatusCategory.IN_PROGRESS).position(2).isDefault(false).workflowId(workflowId).createdBy(userId).build(),
                TaskStatus.builder().name("Done").color("#10B981").category(StatusCategory.DONE).position(3).isDefault(false).workflowId(workflowId).createdBy(userId).build()
        );
        taskStatusRepository.saveAll(defaultStatuses);
    }

    public Workflow updateWorkflow(String id, com.taskosaur.taskosaur.dto.workflow.UpdateWorkflowRequest request, String userId) {
        Workflow workflow = getWorkflowById(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            workflow.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            workflow.setDescription(request.getDescription());
        }
        if (request.getIsDefault() != null) {
            workflow.setIsDefault(request.getIsDefault());
        }
        workflow.setUpdatedBy(userId);
        return workflowRepository.save(workflow);
    }

    public void deleteWorkflow(String id) {
        Workflow workflow = getWorkflowById(id);
        taskStatusRepository.deleteAll(taskStatusRepository.findByWorkflowIdOrderByPositionAsc(id));
        workflowRepository.delete(workflow);
    }

    public Workflow setDefaultWorkflow(String id, String organizationId, String userId) {
        if (organizationId != null && !organizationId.isBlank()) {
            List<Workflow> orgWorkflows = workflowRepository.findByOrganizationId(organizationId);
            for (Workflow wf : orgWorkflows) {
                wf.setIsDefault(false);
                workflowRepository.save(wf);
            }
        }
        Workflow workflow = getWorkflowById(id);
        workflow.setIsDefault(true);
        workflow.setUpdatedBy(userId);
        return workflowRepository.save(workflow);
    }

    public Workflow activateWorkflow(String id, String userId) {
        Workflow workflow = getWorkflowById(id);
        workflow.setUpdatedBy(userId);
        return workflowRepository.save(workflow);
    }

    public Workflow deactivateWorkflow(String id, String userId) {
        Workflow workflow = getWorkflowById(id);
        workflow.setUpdatedBy(userId);
        return workflowRepository.save(workflow);
    }

    public Workflow archiveWorkflow(String id, String userId) {
        Workflow workflow = getWorkflowById(id);
        workflow.setUpdatedBy(userId);
        return workflowRepository.save(workflow);
    }

    public List<TaskStatus> getWorkflowStages(String id) {
        return taskStatusRepository.findByWorkflowIdOrderByPositionAsc(id);
    }

    public List<Workflow> searchWorkflows(String organizationId, String search) {
        List<Workflow> list = workflowRepository.findByOrganizationId(organizationId);
        if (search == null || search.isBlank()) {
            return list;
        }
        String lower = search.toLowerCase();
        return list.stream()
                .filter(w -> (w.getName() != null && w.getName().toLowerCase().contains(lower))
                        || (w.getDescription() != null && w.getDescription().toLowerCase().contains(lower)))
                .toList();
    }
}

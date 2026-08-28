package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.label.TaskLabelResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Label;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskLabel;
import com.taskosaur.taskosaur.models.TaskLabelId;
import com.taskosaur.taskosaur.repositories.LabelRepository;
import com.taskosaur.taskosaur.repositories.TaskLabelRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskLabelService {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private final TaskLabelRepository taskLabelRepository;
    private final LabelRepository labelRepository;
    private final TaskRepository taskRepository;

    public TaskLabelResponse assignLabel(String taskIdOrSlug, String labelId, String userId) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found with id: " + labelId));

        TaskLabelId id = new TaskLabelId(effectiveTaskId, labelId);
        TaskLabel taskLabel = TaskLabel.builder()
                .id(id)
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        TaskLabel saved = taskLabelRepository.save(taskLabel);
        return TaskLabelResponse.builder()
                .taskId(saved.getId().getTaskId())
                .labelId(saved.getId().getLabelId())
                .label(label)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    public List<TaskLabelResponse> getLabelsByTask(String taskIdOrSlug) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        List<TaskLabel> taskLabels = taskLabelRepository.findByIdTaskId(effectiveTaskId);
        return taskLabels.stream()
                .map(tl -> {
                    Label label = labelRepository.findById(tl.getId().getLabelId()).orElse(null);
                    return TaskLabelResponse.builder()
                            .taskId(tl.getId().getTaskId())
                            .labelId(tl.getId().getLabelId())
                            .label(label)
                            .createdAt(tl.getCreatedAt())
                            .updatedAt(tl.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    public void removeLabel(String taskIdOrSlug, String labelId) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        taskLabelRepository.deleteByIdTaskIdAndIdLabelId(effectiveTaskId, labelId);
    }

    private String resolveTaskId(String taskIdOrSlug) {
        if (taskIdOrSlug == null || taskIdOrSlug.isBlank()) {
            throw new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug);
        }
        if (UUID_PATTERN.matcher(taskIdOrSlug).matches()) {
            return taskRepository.findById(taskIdOrSlug)
                    .map(Task::getId)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug));
        }
        return taskRepository.findBySlug(taskIdOrSlug)
                .map(Task::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug));
    }
}

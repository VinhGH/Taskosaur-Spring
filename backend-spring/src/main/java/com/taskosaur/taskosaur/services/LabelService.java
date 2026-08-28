package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.label.CreateLabelRequest;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Label;
import com.taskosaur.taskosaur.repositories.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class LabelService {

    private final LabelRepository labelRepository;

    public Label createLabel(CreateLabelRequest request, String userId) {
        Label label = Label.builder()
                .name(request.getName().trim())
                .color(request.getColor().trim())
                .description(request.getDescription())
                .projectId(request.getProjectId())
                .createdBy(userId)
                .updatedBy(userId)
                .build();
        return labelRepository.save(label);
    }

    public List<Label> getLabelsByProject(String projectId) {
        return labelRepository.findByProjectId(projectId);
    }

    public Label getLabelById(String id) {
        return labelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found with id: " + id));
    }

    public Label updateLabel(String id, Map<String, String> updates, String userId) {
        Label label = getLabelById(id);
        if (updates.containsKey("name") && updates.get("name") != null) {
            label.setName(updates.get("name").trim());
        }
        if (updates.containsKey("color") && updates.get("color") != null) {
            label.setColor(updates.get("color").trim());
        }
        if (updates.containsKey("description")) {
            label.setDescription(updates.get("description"));
        }
        label.setUpdatedBy(userId);
        return labelRepository.save(label);
    }

    public void deleteLabel(String id) {
        Label label = getLabelById(id);
        labelRepository.delete(label);
    }

    public List<Label> searchLabels(String projectId, String query) {
        if (query == null || query.isBlank()) {
            return getLabelsByProject(projectId);
        }
        return labelRepository.findByProjectIdAndNameContainingIgnoreCase(projectId, query.trim());
    }
}

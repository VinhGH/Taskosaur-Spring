package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.sprint.CreateSprintRequest;
import com.taskosaur.taskosaur.dto.sprint.SprintResponse;
import com.taskosaur.taskosaur.dto.sprint.UpdateSprintRequest;
import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Sprint;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.SprintRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public String generateUniqueSlug(String name, String projectId, String excludeSprintId) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (base.isEmpty()) {
            base = "sprint";
        }

        String slug = base;
        int counter = 1;
        while (true) {
            final String testSlug = slug;
            boolean exists = sprintRepository.findByProjectIdAndSlug(projectId, testSlug)
                    .filter(s -> excludeSprintId == null || !s.getId().equals(excludeSprintId))
                    .isPresent();
            if (!exists) {
                break;
            }
            slug = base + "-" + counter;
            counter++;
        }
        return slug;
    }

    public SprintResponse buildSprintResponse(Sprint sprint) {
        long taskCount = taskRepository.countBySprintId(sprint.getId());
        return SprintResponse.builder()
                .id(sprint.getId())
                .name(sprint.getName())
                .slug(sprint.getSlug())
                .goal(sprint.getGoal())
                .status(sprint.getStatus())
                .isDefault(sprint.getIsDefault())
                .archive(sprint.getArchive())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .projectId(sprint.getProjectId())
                .createdBy(sprint.getCreatedBy())
                .updatedBy(sprint.getUpdatedBy())
                .createdAt(sprint.getCreatedAt())
                .updatedAt(sprint.getUpdatedAt())
                .count(SprintResponse.CountDto.builder()
                        .tasks(taskCount)
                        .build())
                .build();
    }

    @Transactional
    public SprintResponse createSprint(CreateSprintRequest request, String userId) {
        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId()).orElse(null);
        } else if (request.getProjectSlug() != null) {
            project = projectRepository.findBySlug(request.getProjectSlug()).orElse(null);
        }

        if (project == null) {
            throw new ResourceNotFoundException("Project not found");
        }

        String slug = generateUniqueSlug(request.getName(), project.getId(), null);

        Sprint sprint = Sprint.builder()
                .name(request.getName())
                .slug(slug)
                .goal(request.getGoal())
                .status(request.getStatus() != null ? request.getStatus() : SprintStatus.PLANNING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .projectId(project.getId())
                .createdBy(userId)
                .updatedBy(userId)
                .isDefault(false)
                .archive(false)
                .build();

        Sprint saved = sprintRepository.save(sprint);
        return buildSprintResponse(saved);
    }

    public List<SprintResponse> findAll(String userId, String projectId, SprintStatus status) {
        List<Sprint> sprints;
        if (projectId != null && status != null) {
            sprints = sprintRepository.findByProjectIdAndStatusAndArchiveFalse(projectId, status);
        } else if (projectId != null) {
            sprints = sprintRepository.findByProjectIdAndArchiveFalse(projectId);
        } else {
            sprints = sprintRepository.findAll().stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getArchive()))
                    .collect(Collectors.toList());
        }

        return sprints.stream().map(this::buildSprintResponse).collect(Collectors.toList());
    }

    public List<SprintResponse> findAllByProjectSlug(String userId, String slug, SprintStatus status) {
        if (slug == null || slug.isEmpty()) {
            return findAll(userId, null, status);
        }

        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + slug));

        return findAll(userId, project.getId(), status);
    }

    public SprintResponse findBySlug(String projectSlug, String sprintSlug, String userId) {
        Project project = projectRepository.findBySlug(projectSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + projectSlug));

        Sprint sprint = sprintRepository.findByProjectIdAndSlug(project.getId(), sprintSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with slug: " + sprintSlug));

        return buildSprintResponse(sprint);
    }

    public SprintResponse findOne(String id, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));
        return buildSprintResponse(sprint);
    }

    public SprintResponse getActiveSprint(String projectId, String userId) {
        Sprint sprint = sprintRepository.findFirstByProjectIdAndStatus(projectId, SprintStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active sprint found for project: " + projectId));
        return buildSprintResponse(sprint);
    }

    @Transactional
    public SprintResponse update(String id, UpdateSprintRequest request, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            sprint.setName(request.getName().trim());
            sprint.setSlug(generateUniqueSlug(request.getName(), sprint.getProjectId(), sprint.getId()));
        }
        if (request.getGoal() != null) {
            sprint.setGoal(request.getGoal());
        }
        if (request.getStatus() != null) {
            sprint.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            sprint.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            sprint.setEndDate(request.getEndDate());
        }
        if (request.getArchive() != null) {
            sprint.setArchive(request.getArchive());
        }
        sprint.setUpdatedBy(userId);

        Sprint saved = sprintRepository.save(sprint);
        return buildSprintResponse(saved);
    }

    @Transactional
    public SprintResponse startSprint(String id, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        // Check if there is already an active sprint in this project
        sprintRepository.findFirstByProjectIdAndStatus(sprint.getProjectId(), SprintStatus.ACTIVE)
                .ifPresent(active -> {
                    if (!active.getId().equals(sprint.getId())) {
                        throw new BadRequestException("Another sprint is currently active in this project");
                    }
                });

        sprint.setStatus(SprintStatus.ACTIVE);
        sprint.setUpdatedBy(userId);
        Sprint saved = sprintRepository.save(sprint);
        return buildSprintResponse(saved);
    }

    @Transactional
    public SprintResponse completeSprint(String id, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        sprint.setStatus(SprintStatus.COMPLETED);
        sprint.setUpdatedBy(userId);
        Sprint saved = sprintRepository.save(sprint);
        return buildSprintResponse(saved);
    }

    @Transactional
    public void remove(String id, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));
        sprintRepository.delete(sprint);
    }

    @Transactional
    public void archiveSprint(String id, String userId) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));
        sprint.setArchive(true);
        sprint.setUpdatedBy(userId);
        sprintRepository.save(sprint);
    }
}

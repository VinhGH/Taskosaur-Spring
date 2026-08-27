package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.project.CreateProjectRequest;
import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.ProjectMember;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.ProjectMemberRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("[\\s]");
    private static final Pattern NON_ALPHANUMERIC_PATTERN = Pattern.compile("[^\\w-]");

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkflowService workflowService;

    private String generateSlug(String input, String workspaceId) {
        String nowhitespace = WHITESPACE_PATTERN.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String baseSlug = NON_ALPHANUMERIC_PATTERN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);

        String uniqueSlug = baseSlug;
        int counter = 1;
        while (projectRepository.existsByWorkspaceIdAndSlug(workspaceId, uniqueSlug)) {
            uniqueSlug = baseSlug + "-" + counter++;
        }
        return uniqueSlug;
    }

    private String generateTaskPrefix(String name) {
        String cleanName = name.replaceAll("[^a-zA-Z0-9\\s]", "").trim().toUpperCase();
        String[] words = cleanName.split("\\s+");
        StringBuilder prefixBuilder = new StringBuilder();

        if (words.length >= 2) {
            for (String word : words) {
                if (!word.isEmpty() && prefixBuilder.length() < 5) {
                    prefixBuilder.append(word.charAt(0));
                }
            }
        } else if (cleanName.length() >= 3) {
            prefixBuilder.append(cleanName.substring(0, Math.min(cleanName.length(), 4)));
        } else {
            prefixBuilder.append("PRJ");
        }

        String basePrefix = prefixBuilder.toString();
        String uniquePrefix = basePrefix;
        int counter = 1;
        while (projectRepository.existsByTaskPrefix(uniquePrefix)) {
            uniquePrefix = basePrefix + counter++;
            if (uniquePrefix.length() > 8) {
                uniquePrefix = uniquePrefix.substring(0, 8);
            }
        }
        return uniquePrefix;
    }

    public ProjectResponse createProject(CreateProjectRequest request, String userId) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + request.getWorkspaceId()));

        String workflowId = request.getWorkflowId();
        if (workflowId == null || workflowId.isBlank()) {
            var defaultWorkflow = workflowService.getOrCreateDefaultWorkflow(workspace.getOrganizationId(), userId);
            workflowId = defaultWorkflow.getId();
        }

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getName(), workspace.getId());
        }

        String taskPrefix = request.getTaskPrefix();
        if (taskPrefix == null || taskPrefix.isBlank()) {
            taskPrefix = generateTaskPrefix(request.getName());
        }

        Project project = Project.builder()
                .name(request.getName().trim())
                .slug(slug)
                .taskPrefix(taskPrefix)
                .description(request.getDescription())
                .avatar(request.getAvatar())
                .color(request.getColor() != null ? request.getColor() : "#3B82F6")
                .status(request.getStatus())
                .priority(request.getPriority())
                .visibility(request.getVisibility())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .workspaceId(workspace.getId())
                .workflowId(workflowId)
                .createdBy(userId)
                .archive(false)
                .build();

        Project savedProject = projectRepository.save(project);

        if (userId != null && !userId.isBlank()) {
            ProjectMember ownerMember = ProjectMember.builder()
                    .projectId(savedProject.getId())
                    .userId(userId)
                    .role(Role.OWNER)
                    .build();
            projectMemberRepository.save(ownerMember);
        }

        return buildProjectResponse(savedProject);
    }

    public List<ProjectResponse> getProjectsByWorkspace(String workspaceId) {
        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        return projects.stream()
                .map(this::buildProjectResponse)
                .toList();
    }

    public ProjectResponse getProjectById(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return buildProjectResponse(project);
    }

    public ProjectResponse getProjectBySlug(String workspaceId, String slug) {
        Project project = projectRepository.findByWorkspaceIdAndSlug(workspaceId, slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + slug));
        return buildProjectResponse(project);
    }

    public void deleteProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    private ProjectResponse buildProjectResponse(Project project) {
        long memberCount = projectMemberRepository.countByProjectId(project.getId());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .slug(project.getSlug())
                .taskPrefix(project.getTaskPrefix())
                .description(project.getDescription())
                .avatar(project.getAvatar())
                .color(project.getColor())
                .status(project.getStatus())
                .priority(project.getPriority())
                .visibility(project.getVisibility())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .workspaceId(project.getWorkspaceId())
                .workflowId(project.getWorkflowId())
                .createdBy(project.getCreatedBy())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .count(ProjectResponse.CountDto.builder()
                        .tasks(0)
                        .members(memberCount)
                        .sprints(0)
                        .build())
                .build();
    }
}

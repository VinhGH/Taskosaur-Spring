package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.project.CreateProjectRequest;
import com.taskosaur.taskosaur.dto.project.ProjectResponse;
import com.taskosaur.taskosaur.dto.project.UpdateProjectRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.ProjectMember;
import com.taskosaur.taskosaur.models.Sprint;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.ProjectMemberRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.SprintRepository;
import com.taskosaur.taskosaur.repositories.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final SprintRepository sprintRepository;

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
                .name(request.getName())
                .slug(slug)
                .taskPrefix(taskPrefix)
                .description(request.getDescription())
                .avatar(request.getAvatar())
                .color(request.getColor())
                .status(request.getStatus() != null ? request.getStatus() : com.taskosaur.taskosaur.enums.ProjectStatus.PLANNING)
                .priority(request.getPriority() != null ? request.getPriority() : com.taskosaur.taskosaur.enums.ProjectPriority.MEDIUM)
                .visibility(request.getVisibility() != null ? request.getVisibility() : com.taskosaur.taskosaur.enums.ProjectVisibility.PRIVATE)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .workspaceId(request.getWorkspaceId())
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
        if (projects.isEmpty()) {
            Workspace ws = workspaceRepository.findById(workspaceId).orElse(null);
            if (ws != null) {
                var defaultWorkflow = workflowService.getOrCreateDefaultWorkflow(ws.getOrganizationId(), ws.getCreatedBy());
                Project defaultProj = Project.builder()
                        .name("My Project")
                        .slug("my-project")
                        .description("Default project")
                        .workspaceId(workspaceId)
                        .workflowId(defaultWorkflow.getId())
                        .taskPrefix("PRJ")
                        .color("#3B82F6")
                        .archive(false)
                        .createdBy(ws.getCreatedBy())
                        .build();
                Project saved = projectRepository.save(defaultProj);
                if (ws.getCreatedBy() != null) {
                    ProjectMember member = ProjectMember.builder()
                            .projectId(saved.getId())
                            .userId(ws.getCreatedBy())
                            .role(Role.OWNER)
                            .createdBy(ws.getCreatedBy())
                            .build();
                    projectMemberRepository.save(member);
                }
                Sprint sprint = Sprint.builder()
                        .name("Sprint 1")
                        .slug("sprint-1")
                        .goal("Default sprint")
                        .status(SprintStatus.ACTIVE)
                        .isDefault(true)
                        .projectId(saved.getId())
                        .createdBy(ws.getCreatedBy())
                        .build();
                sprintRepository.save(sprint);
                projects = List.of(saved);
            }
        }
        return projects.stream()
                .map(this::buildProjectResponse)
                .toList();
    }

    public List<ProjectResponse> getProjectsByOrganization(String organizationId, String workspaceId, String search) {
        List<Workspace> workspaces = workspaceRepository.findByOrganizationId(organizationId);
        List<String> wsIds = workspaces.stream().map(Workspace::getId).toList();
        if (wsIds.isEmpty()) {
            return List.of();
        }
        return projectRepository.findAll().stream()
                .filter(p -> wsIds.contains(p.getWorkspaceId()))
                .filter(p -> workspaceId == null || workspaceId.isBlank() || p.getWorkspaceId().equals(workspaceId))
                .filter(p -> search == null || search.isBlank() || (p.getName() != null && p.getName().toLowerCase().contains(search.toLowerCase())))
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

    public ProjectResponse getProjectBySlugOnly(String slug) {
        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + slug));
        return buildProjectResponse(project);
    }

    public Map<String, Object> getBulkProjectHealthStats(List<String> projectIds) {
        Map<String, Object> result = new HashMap<>();
        if (projectIds == null || projectIds.isEmpty()) {
            return result;
        }
        for (String id : projectIds) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTasks", 0);
            stats.put("completedTasks", 0);
            stats.put("overdueTasks", 0);
            stats.put("upcomingTasks", 0);
            stats.put("completionPredictor", 0);
            stats.put("heatmapData", List.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));
            result.put(id, stats);
        }
        return result;
    }

    public ProjectResponse updateProject(String id, UpdateProjectRequest request, String userId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getAvatar() != null) {
            project.setAvatar(request.getAvatar());
        }
        if (request.getColor() != null) {
            project.setColor(request.getColor());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            project.setPriority(request.getPriority());
        }
        if (request.getVisibility() != null) {
            project.setVisibility(request.getVisibility());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        if (request.getWorkflowId() != null && !request.getWorkflowId().isBlank()) {
            project.setWorkflowId(request.getWorkflowId());
        }
        if (request.getWorkspaceId() != null && !request.getWorkspaceId().isBlank()) {
            project.setWorkspaceId(request.getWorkspaceId());
        }
        if (request.getArchive() != null) {
            project.setArchive(request.getArchive());
        }

        Project updated = projectRepository.save(project);
        return buildProjectResponse(updated);
    }

    public ProjectResponse archiveProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        project.setArchive(true);
        return buildProjectResponse(projectRepository.save(project));
    }

    public ProjectResponse unarchiveProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        project.setArchive(false);
        return buildProjectResponse(projectRepository.save(project));
    }

    public void deleteProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        // Cascade: remove all project members first
        projectMemberRepository.deleteAll(projectMemberRepository.findByProjectId(id));

        projectRepository.delete(project);
    }

    private ProjectResponse buildProjectResponse(Project project) {
        long memberCount = projectMemberRepository.countByProjectId(project.getId());

        ProjectResponse.WorkspaceDto workspaceDto = null;
        if (project.getWorkspaceId() != null) {
            Workspace ws = workspaceRepository.findById(project.getWorkspaceId()).orElse(null);
            if (ws != null) {
                workspaceDto = ProjectResponse.WorkspaceDto.builder()
                        .id(ws.getId())
                        .name(ws.getName())
                        .slug(ws.getSlug())
                        .build();
            }
        }

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
                .workspace(workspaceDto)
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

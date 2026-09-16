package com.taskosaur.taskosaur.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskosaur.taskosaur.dto.github.*;
import com.taskosaur.taskosaur.enums.TaskPriority;
import com.taskosaur.taskosaur.enums.TaskType;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.GithubSync;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskStatus;
import com.taskosaur.taskosaur.repositories.GithubSyncRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.TaskStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GithubSyncService {

    private final GithubSyncRepository githubSyncRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Validate personal access token and list all repositories the user has access to.
     */
    @Transactional(readOnly = true)
    public List<GithubRepoResponse> validateAndListRepos(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new BadRequestException("GitHub token is required");
        }
        String cleanToken = token.trim();

        try {
            // 1. Verify user authentication
            HttpRequest userReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user"))
                    .header("Authorization", "Bearer " + cleanToken)
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "Taskosaur-App")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> userRes = httpClient.send(userReq, HttpResponse.BodyHandlers.ofString());
            if (userRes.statusCode() == 401 || userRes.statusCode() == 403) {
                throw new BadRequestException("Invalid GitHub token or insufficient permissions");
            }
            if (userRes.statusCode() < 200 || userRes.statusCode() >= 300) {
                throw new BadRequestException("GitHub API error: HTTP " + userRes.statusCode());
            }

            // 2. Fetch accessible repositories
            HttpRequest reposReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member"))
                    .header("Authorization", "Bearer " + cleanToken)
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "Taskosaur-App")
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> reposRes = httpClient.send(reposReq, HttpResponse.BodyHandlers.ofString());
            if (reposRes.statusCode() != 200) {
                throw new BadRequestException("Failed to fetch GitHub repositories (HTTP " + reposRes.statusCode() + ")");
            }

            JsonNode root = objectMapper.readTree(reposRes.body());
            List<GithubRepoResponse> result = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) {
                    result.add(GithubRepoResponse.builder()
                            .id(node.path("id").asLong())
                            .name(node.path("name").asText())
                            .fullName(node.path("full_name").asText())
                            .owner(node.path("owner").path("login").asText())
                            .description(node.path("description").asText(null))
                            .htmlUrl(node.path("html_url").asText())
                            .defaultBranch(node.path("default_branch").asText("main"))
                            .isPrivate(node.path("private").asBoolean(false))
                            .openIssuesCount(node.path("open_issues_count").asInt(0))
                            .build());
                }
            }
            return result;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to query GitHub API: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to connect to GitHub API: " + e.getMessage());
        }
    }

    /**
     * Connect a project with a GitHub repository and initiate first sync.
     */
    public GithubSyncStatusResponse connect(ConnectGithubRequest req, String userId) {
        if (req.getProjectId() == null || req.getProjectId().trim().isEmpty()) {
            throw new BadRequestException("projectId is required");
        }
        if (req.getRepoOwner() == null || req.getRepoName() == null) {
            throw new BadRequestException("repoOwner and repoName are required");
        }
        if (req.getToken() == null || req.getToken().trim().isEmpty()) {
            throw new BadRequestException("GitHub token is required");
        }

        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        GithubSync sync = githubSyncRepository.findByProjectId(project.getId())
                .orElse(GithubSync.builder()
                        .projectId(project.getId())
                        .workspaceId(project.getWorkspaceId())
                        .createdById(userId)
                        .build());

        sync.setGithubRepoOwner(req.getRepoOwner().trim());
        sync.setGithubRepoName(req.getRepoName().trim());
        sync.setGithubRepoId(req.getRepoId());
        sync.setGithubToken(req.getToken().trim());
        sync.setSyncEnabled(true);
        sync.setSyncInterval(req.getSyncInterval() != null ? req.getSyncInterval() : 15);
        sync.setSyncDirection(req.getSyncDirection() != null ? req.getSyncDirection() : "ONE_WAY_IMPORT");
        sync.setUpdatedById(userId);

        if (req.getStatusMappings() != null) {
            try {
                sync.setStatusMappings(objectMapper.writeValueAsString(req.getStatusMappings()));
            } catch (Exception e) {
                log.warn("Failed to serialize status mappings: {}", e.getMessage());
            }
        }

        GithubSync savedSync = githubSyncRepository.save(sync);

        // Perform initial sync
        try {
            syncIssues(savedSync, userId);
        } catch (Exception e) {
            log.warn("Initial sync encountered an issue: {}", e.getMessage());
        }

        return toStatusResponse(savedSync);
    }

    /**
     * Get synchronization status for a project.
     */
    @Transactional(readOnly = true)
    public GithubSyncStatusResponse getStatus(String projectId) {
        return githubSyncRepository.findByProjectId(projectId)
                .map(this::toStatusResponse)
                .orElse(null);
    }

    /**
     * Update sync settings.
     */
    public GithubSyncStatusResponse updateSync(String projectId, UpdateGithubSyncRequest req, String userId) {
        GithubSync sync = githubSyncRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub sync not configured for project " + projectId));

        if (req.getSyncEnabled() != null) {
            sync.setSyncEnabled(req.getSyncEnabled());
        }
        if (req.getSyncInterval() != null) {
            sync.setSyncInterval(req.getSyncInterval());
        }
        if (req.getSyncDirection() != null) {
            sync.setSyncDirection(req.getSyncDirection());
        }
        if (req.getStatusMappings() != null) {
            try {
                sync.setStatusMappings(objectMapper.writeValueAsString(req.getStatusMappings()));
            } catch (Exception e) {
                log.warn("Failed to serialize status mappings: {}", e.getMessage());
            }
        }
        sync.setUpdatedById(userId);

        GithubSync updated = githubSyncRepository.save(sync);
        return toStatusResponse(updated);
    }

    /**
     * Trigger manual synchronization.
     */
    public GithubSyncStatusResponse syncNow(String projectId, String userId) {
        GithubSync sync = githubSyncRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub sync not configured for project " + projectId));

        syncIssues(sync, userId);
        return toStatusResponse(sync);
    }

    /**
     * Disconnect and remove sync configuration.
     */
    public void disconnect(String projectId) {
        githubSyncRepository.findByProjectId(projectId).ifPresent(githubSyncRepository::delete);
    }

    /**
     * Internal: Fetch GitHub issues and synchronize with Taskosaur tasks.
     */
    public void syncIssues(GithubSync sync, String userId) {
        Project project = projectRepository.findById(sync.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Map<String, String> mappings = parseStatusMappings(sync.getStatusMappings());
        String defaultStatusId = resolveDefaultStatusId(project);

        String url = String.format("https://api.github.com/repos/%s/%s/issues?state=all&per_page=100&sort=updated&direction=desc",
                sync.getGithubRepoOwner(), sync.getGithubRepoName());

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + sync.getGithubToken())
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "Taskosaur-App")
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                sync.setLastSyncStatus("FAILED");
                sync.setLastSyncError("GitHub API HTTP " + res.statusCode() + ": " + res.body());
                sync.setLastSyncAt(LocalDateTime.now());
                githubSyncRepository.save(sync);
                return;
            }

            JsonNode issues = objectMapper.readTree(res.body());
            int importedCount = 0;

            if (issues.isArray()) {
                for (JsonNode issueNode : issues) {
                    // Skip Pull Requests (GitHub returns PRs inside issues endpoint with "pull_request" object)
                    if (issueNode.has("pull_request") && !issueNode.get("pull_request").isNull()) {
                        continue;
                    }

                    String issueId = issueNode.path("id").asText();
                    int issueNumber = issueNode.path("number").asInt();
                    String title = issueNode.path("title").asText("[GitHub Issue #" + issueNumber + "]");
                    String body = issueNode.path("body").asText("");
                    String htmlUrl = issueNode.path("html_url").asText();
                    String state = issueNode.path("state").asText("open"); // "open" or "closed"

                    // Determine target statusId
                    String targetStatusId = mappings.getOrDefault(state, mappings.getOrDefault(state.toLowerCase(), defaultStatusId));
                    if (targetStatusId == null || targetStatusId.isEmpty()) {
                        targetStatusId = defaultStatusId;
                    }

                    // Check if task exists
                    Optional<Task> existingTaskOpt = taskRepository.findByGithubIssueId(issueId);
                    if (existingTaskOpt.isEmpty()) {
                        existingTaskOpt = taskRepository.findByProjectIdAndGithubIssueNumber(project.getId(), issueNumber);
                    }

                    if (existingTaskOpt.isPresent()) {
                        Task existing = existingTaskOpt.get();
                        boolean modified = false;
                        if (existing.getGithubIssueId() == null) {
                            existing.setGithubIssueId(issueId);
                            modified = true;
                        }
                        if (existing.getGithubIssueUrl() == null) {
                            existing.setGithubIssueUrl(htmlUrl);
                            modified = true;
                        }
                        if (existing.getGithubIssueNumber() == null) {
                            existing.setGithubIssueNumber(issueNumber);
                            modified = true;
                        }
                        // Update status if mapped state changed
                        if (targetStatusId != null && !targetStatusId.equals(existing.getStatusId())) {
                            existing.setStatusId(targetStatusId);
                            modified = true;
                        }
                        if (modified) {
                            taskRepository.save(existing);
                        }
                    } else {
                        // Create new Task
                        int nextTaskNumber = taskRepository.findMaxTaskNumberByProjectId(project.getId()) + 1;
                        String prefix = (project.getTaskPrefix() != null && !project.getTaskPrefix().isEmpty())
                                ? project.getTaskPrefix()
                                : "TASK";
                        String slug = prefix + "-" + nextTaskNumber;

                        Task newTask = Task.builder()
                                .title(title)
                                .description(body.isEmpty() ? null : body)
                                .type(TaskType.TASK)
                                .priority(TaskPriority.MEDIUM)
                                .taskNumber(nextTaskNumber)
                                .slug(slug)
                                .projectId(project.getId())
                                .statusId(targetStatusId)
                                .githubIssueId(issueId)
                                .githubIssueNumber(issueNumber)
                                .githubIssueUrl(htmlUrl)
                                .createdBy(userId)
                                .build();

                        taskRepository.save(newTask);
                        importedCount++;
                    }
                }
            }

            sync.setIssuesImported((sync.getIssuesImported() != null ? sync.getIssuesImported() : 0) + importedCount);
            sync.setLastSyncAt(LocalDateTime.now());
            sync.setLastSyncStatus("SUCCESS");
            sync.setLastSyncError(null);
            githubSyncRepository.save(sync);

        } catch (Exception e) {
            log.error("Error executing GitHub sync for project {}: {}", sync.getProjectId(), e.getMessage(), e);
            sync.setLastSyncStatus("FAILED");
            sync.setLastSyncError(e.getMessage());
            sync.setLastSyncAt(LocalDateTime.now());
            githubSyncRepository.save(sync);
        }
    }

    private String resolveDefaultStatusId(Project project) {
        if (project.getWorkflowId() != null) {
            return taskStatusRepository.findByWorkflowIdAndIsDefaultTrue(project.getWorkflowId())
                    .map(TaskStatus::getId)
                    .orElseGet(() -> {
                        List<TaskStatus> statuses = taskStatusRepository.findByWorkflowIdOrderByPositionAsc(project.getWorkflowId());
                        return statuses.isEmpty() ? null : statuses.get(0).getId();
                    });
        }
        return null;
    }

    private Map<String, String> parseStatusMappings(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private GithubSyncStatusResponse toStatusResponse(GithubSync sync) {
        return GithubSyncStatusResponse.builder()
                .id(sync.getId())
                .projectId(sync.getProjectId())
                .workspaceId(sync.getWorkspaceId())
                .githubRepoOwner(sync.getGithubRepoOwner())
                .githubRepoName(sync.getGithubRepoName())
                .githubRepoId(sync.getGithubRepoId())
                .syncEnabled(sync.getSyncEnabled())
                .syncInterval(sync.getSyncInterval())
                .syncDirection(sync.getSyncDirection())
                .lastSyncAt(sync.getLastSyncAt())
                .lastSyncStatus(sync.getLastSyncStatus())
                .lastSyncError(sync.getLastSyncError())
                .issuesImported(sync.getIssuesImported())
                .statusMappings(parseStatusMappings(sync.getStatusMappings()))
                .hasToken(sync.getGithubToken() != null && !sync.getGithubToken().isEmpty())
                .createdAt(sync.getCreatedAt())
                .updatedAt(sync.getUpdatedAt())
                .build();
    }
}

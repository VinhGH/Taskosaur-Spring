package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.dto.activity.LogActivityParams;
import com.taskosaur.taskosaur.models.ActivityLog;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ActivityLogService {

    private static final String KEY_CURRENT_PAGE = "currentPage";
    private static final String KEY_TOTAL_PAGES = "totalPages";
    private static final String KEY_TOTAL_COUNT = "totalCount";
    private static final String KEY_HAS_NEXT_PAGE = "hasNextPage";
    private static final String KEY_HAS_PREV_PAGE = "hasPrevPage";
    private static final String KEY_ACTIVITIES = "activities";
    private static final String KEY_PAGINATION = "pagination";

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final SprintRepository sprintRepository;

    public void logActivity(LogActivityParams params) {
        ActivityLog activityLog = ActivityLog.builder()
                .type(params.getType())
                .description(params.getDescription())
                .entityType(params.getEntityType())
                .entityId(params.getEntityId())
                .oldValue(params.getOldValue())
                .newValue(params.getNewValue())
                .userId(params.getUserId())
                .organizationId(params.getOrganizationId())
                .createdBy(params.getUserId())
                .build();
        activityLogRepository.save(activityLog);
    }

    public List<ActivityLogResponse> getActivitiesByEntity(String entityIdOrSlug) {
        String effectiveId = resolveEntityId(entityIdOrSlug);
        if (effectiveId == null) {
            return List.of();
        }
        return activityLogRepository.findByEntityIdOrderByCreatedAtDesc(effectiveId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public List<ActivityLogResponse> getActivitiesByOrganization(String organizationId) {
        return activityLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public Map<String, Object> getRecentActivityByOrganization(String organizationId, int limit, int page, String entityType, String userId) {
        List<ActivityLog> all = activityLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
        List<ActivityLog> filtered = filterActivities(all, entityType, userId);
        return paginateActivities(filtered, limit, page);
    }

    public Map<String, Object> getRecentActivityByWorkspace(String workspaceId, int limit, int page, String entityType, String userId) {
        Optional<Workspace> wsOpt = workspaceRepository.findById(workspaceId);
        if (wsOpt.isEmpty()) {
            return buildPagedResult(List.of(), buildPagination(page, 0, 0, false, false));
        }

        Workspace workspace = wsOpt.get();
        Set<String> validEntityIds = collectWorkspaceEntityIds(workspaceId);

        List<ActivityLog> all = activityLogRepository.findByOrganizationIdOrderByCreatedAtDesc(workspace.getOrganizationId())
                .stream()
                .filter(a -> validEntityIds.contains(a.getEntityId()))
                .toList();

        List<ActivityLog> filtered = filterActivities(all, entityType, userId);
        return paginateActivities(filtered, limit, page);
    }

    public Map<String, Object> getOrganizationStats(String organizationId, int days) {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(Math.max(1, days));
        List<ActivityLog> all = activityLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId).stream()
                .filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(cutoff))
                .toList();
        Map<String, Object> result = new HashMap<>();
        result.put("totalActivities", all.size());
        result.put("activitiesByType", Map.of());
        result.put("activitiesByUser", List.of());
        result.put("activitiesByDate", List.of());
        return result;
    }

    public Map<String, Object> getTaskActivities(String taskIdOrSlug, int limit, int page) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        if (effectiveTaskId == null) {
            return buildPagedResult(List.of(), buildPagination(page, 0, 0, false, false));
        }

        List<ActivityLog> all = activityLogRepository.findByEntityIdOrderByCreatedAtDesc(effectiveTaskId);
        return paginateActivities(all, limit, page);
    }

    private List<ActivityLog> filterActivities(List<ActivityLog> logs, String entityType, String userId) {
        return logs.stream()
                .filter(a -> entityType == null || entityType.isBlank() || entityType.equalsIgnoreCase(a.getEntityType()))
                .filter(a -> userId == null || userId.isBlank() || userId.equals(a.getUserId()))
                .toList();
    }

    private Set<String> collectWorkspaceEntityIds(String workspaceId) {
        Set<String> ids = new HashSet<>();
        ids.add(workspaceId);

        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        List<String> projectIds = projects.stream().map(Project::getId).toList();
        ids.addAll(projectIds);

        if (!projectIds.isEmpty()) {
            List<Task> tasks = taskRepository.findByProjectIdIn(projectIds);
            tasks.forEach(t -> ids.add(t.getId()));
        }
        return ids;
    }

    private Map<String, Object> paginateActivities(List<ActivityLog> all, int limit, int page) {
        int totalCount = all.size();
        int totalPages = totalCount > 0 ? (int) Math.ceil((double) totalCount / limit) : 0;
        int skip = (page - 1) * limit;

        List<ActivityLogResponse> paged = all.stream()
                .skip(Math.max(0, skip))
                .limit(limit)
                .map(this::buildResponse)
                .toList();

        Map<String, Object> pagination = buildPagination(page, totalPages, totalCount, page < totalPages, page > 1);
        return buildPagedResult(paged, pagination);
    }

    private Map<String, Object> buildPagination(int page, int totalPages, int totalCount, boolean hasNext, boolean hasPrev) {
        Map<String, Object> pagination = new HashMap<>();
        pagination.put(KEY_CURRENT_PAGE, page);
        pagination.put(KEY_TOTAL_PAGES, totalPages);
        pagination.put(KEY_TOTAL_COUNT, totalCount);
        pagination.put(KEY_HAS_NEXT_PAGE, hasNext);
        pagination.put(KEY_HAS_PREV_PAGE, hasPrev);
        return pagination;
    }

    private Map<String, Object> buildPagedResult(List<ActivityLogResponse> activities, Map<String, Object> pagination) {
        Map<String, Object> result = new HashMap<>();
        result.put(KEY_ACTIVITIES, activities);
        result.put(KEY_PAGINATION, pagination);
        return result;
    }

    private String resolveTaskId(String taskIdOrSlug) {
        if (taskIdOrSlug == null || taskIdOrSlug.isBlank()) return null;
        if (UUID_PATTERN.matcher(taskIdOrSlug).matches()) {
            return taskIdOrSlug;
        }
        return taskRepository.findBySlug(taskIdOrSlug).map(Task::getId).orElse(null);
    }

    private String resolveEntityId(String entityIdOrSlug) {
        if (entityIdOrSlug == null || entityIdOrSlug.isBlank()) return null;
        if (UUID_PATTERN.matcher(entityIdOrSlug).matches()) {
            return entityIdOrSlug;
        }
        return taskRepository.findBySlug(entityIdOrSlug)
                .map(Task::getId)
                .orElseGet(() -> projectRepository.findBySlug(entityIdOrSlug).map(Project::getId).orElse(null));
    }

    private ActivityLogResponse buildResponse(ActivityLog logEntity) {
        ActivityLogResponse.UserSummaryDto userDto = resolveUserSummary(logEntity.getUserId());
        SlugContext slugContext = resolveSlugContext(logEntity);

        return ActivityLogResponse.builder()
                .id(logEntity.getId())
                .type(logEntity.getType())
                .description(logEntity.getDescription())
                .entityType(logEntity.getEntityType())
                .entityId(logEntity.getEntityId())
                .oldValue(logEntity.getOldValue())
                .newValue(logEntity.getNewValue())
                .userId(logEntity.getUserId())
                .user(userDto)
                .organizationId(logEntity.getOrganizationId())
                .taskSlug(slugContext.taskSlug())
                .projectSlug(slugContext.projectSlug())
                .workspaceSlug(slugContext.workspaceSlug())
                .sprintSlug(slugContext.sprintSlug())
                .createdAt(logEntity.getCreatedAt())
                .build();
    }

    private ActivityLogResponse.UserSummaryDto resolveUserSummary(String userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> {
                    String firstName = u.getFirstName() != null ? u.getFirstName() : "";
                    String lastName = u.getLastName() != null ? u.getLastName() : "";
                    String fullName = (firstName + " " + lastName).trim();
                    return ActivityLogResponse.UserSummaryDto.builder()
                            .id(u.getId())
                            .name(fullName.isEmpty() ? u.getUsername() : fullName)
                            .firstName(firstName)
                            .lastName(lastName)
                            .email(u.getEmail())
                            .avatar(u.getAvatar())
                            .build();
                })
                .orElse(null);
    }

    private record SlugContext(String taskSlug, String projectSlug, String workspaceSlug, String sprintSlug) {
        static SlugContext empty() {
            return new SlugContext(null, null, null, null);
        }
    }

    private SlugContext resolveSlugContext(ActivityLog logEntity) {
        String entityType = logEntity.getEntityType();
        String entityId = logEntity.getEntityId();
        if (entityType == null || entityId == null) {
            return SlugContext.empty();
        }

        return switch (entityType.toUpperCase()) {
            case "TASK" -> resolveTaskContext(entityId);
            case "PROJECT" -> resolveProjectContext(entityId);
            case "SPRINT" -> resolveSprintContext(entityId);
            case "WORKSPACE" -> new SlugContext(null, null, resolveWorkspaceSlug(entityId), null);
            default -> SlugContext.empty();
        };
    }

    private SlugContext resolveTaskContext(String taskId) {
        return taskRepository.findById(taskId)
                .map(task -> {
                    String projectSlug = null;
                    String workspaceSlug = null;
                    if (task.getProjectId() != null) {
                        SlugContext pContext = resolveProjectContext(task.getProjectId());
                        projectSlug = pContext.projectSlug();
                        workspaceSlug = pContext.workspaceSlug();
                    }
                    return new SlugContext(task.getSlug(), projectSlug, workspaceSlug, null);
                })
                .orElseGet(SlugContext::empty);
    }

    private SlugContext resolveProjectContext(String projectId) {
        return projectRepository.findById(projectId)
                .map(p -> {
                    String wsSlug = resolveWorkspaceSlug(p.getWorkspaceId());
                    return new SlugContext(null, p.getSlug(), wsSlug, null);
                })
                .orElseGet(SlugContext::empty);
    }

    private SlugContext resolveSprintContext(String sprintId) {
        return sprintRepository.findById(sprintId)
                .map(s -> {
                    String projectSlug = null;
                    String workspaceSlug = null;
                    if (s.getProjectId() != null) {
                        SlugContext pContext = resolveProjectContext(s.getProjectId());
                        projectSlug = pContext.projectSlug();
                        workspaceSlug = pContext.workspaceSlug();
                    }
                    return new SlugContext(null, projectSlug, workspaceSlug, s.getSlug());
                })
                .orElseGet(SlugContext::empty);
    }

    private String resolveWorkspaceSlug(String workspaceId) {
        if (workspaceId == null) return null;
        return workspaceRepository.findById(workspaceId)
                .map(Workspace::getSlug)
                .orElse(null);
    }
}

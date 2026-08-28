package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.dto.activity.LogActivityParams;
import com.taskosaur.taskosaur.models.ActivityLog;
import com.taskosaur.taskosaur.models.Project;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.repositories.ActivityLogRepository;
import com.taskosaur.taskosaur.repositories.ProjectRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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

    public void logActivity(LogActivityParams params) {
        ActivityLog log = ActivityLog.builder()
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
        activityLogRepository.save(log);
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
        if (entityType != null && !entityType.isBlank()) {
            all = all.stream().filter(a -> entityType.equalsIgnoreCase(a.getEntityType())).toList();
        }
        if (userId != null && !userId.isBlank()) {
            all = all.stream().filter(a -> userId.equals(a.getUserId())).toList();
        }

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
            Map<String, Object> pagination = buildPagination(page, 0, 0, false, false);
            return buildPagedResult(List.of(), pagination);
        }

        List<ActivityLog> all = activityLogRepository.findByEntityIdOrderByCreatedAtDesc(effectiveTaskId);
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

    private ActivityLogResponse buildResponse(ActivityLog log) {
        ActivityLogResponse.UserSummaryDto userDto = null;
        var userOpt = userRepository.findById(log.getUserId());
        if (userOpt.isPresent()) {
            var u = userOpt.get();
            String firstName = u.getFirstName() != null ? u.getFirstName() : "";
            String lastName = u.getLastName() != null ? u.getLastName() : "";
            String fullName = (firstName + " " + lastName).trim();
            userDto = ActivityLogResponse.UserSummaryDto.builder()
                    .id(u.getId())
                    .name(fullName.isEmpty() ? u.getUsername() : fullName)
                    .email(u.getEmail())
                    .avatar(u.getAvatar())
                    .build();
        }

        return ActivityLogResponse.builder()
                .id(log.getId())
                .type(log.getType())
                .description(log.getDescription())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .userId(log.getUserId())
                .user(userDto)
                .organizationId(log.getOrganizationId())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

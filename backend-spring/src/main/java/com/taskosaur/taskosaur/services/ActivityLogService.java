package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.dto.activity.LogActivityParams;
import com.taskosaur.taskosaur.models.ActivityLog;
import com.taskosaur.taskosaur.repositories.ActivityLogRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

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

    public List<ActivityLogResponse> getActivitiesByEntity(String entityId) {
        return activityLogRepository.findByEntityIdOrderByCreatedAtDesc(entityId).stream()
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

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page);
        pagination.put("totalPages", totalPages);
        pagination.put("totalCount", totalCount);
        pagination.put("hasNextPage", page < totalPages);
        pagination.put("hasPrevPage", page > 1);

        Map<String, Object> result = new HashMap<>();
        result.put("activities", paged);
        result.put("pagination", pagination);
        return result;
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

    public Map<String, Object> getTaskActivities(String taskId, int limit, int page) {
        List<ActivityLog> all = activityLogRepository.findByEntityIdOrderByCreatedAtDesc(taskId);
        int totalCount = all.size();
        int totalPages = totalCount > 0 ? (int) Math.ceil((double) totalCount / limit) : 0;
        int skip = (page - 1) * limit;
        List<ActivityLogResponse> paged = all.stream()
                .skip(Math.max(0, skip))
                .limit(limit)
                .map(this::buildResponse)
                .toList();

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page);
        pagination.put("totalPages", totalPages);
        pagination.put("totalCount", totalCount);
        pagination.put("hasNextPage", page < totalPages);
        pagination.put("hasPrevPage", page > 1);

        Map<String, Object> result = new HashMap<>();
        result.put("activities", paged);
        result.put("pagination", pagination);
        return result;
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

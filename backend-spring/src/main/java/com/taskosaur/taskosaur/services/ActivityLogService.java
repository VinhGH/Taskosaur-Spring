package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.dto.activity.LogActivityParams;
import com.taskosaur.taskosaur.models.ActivityLog;
import com.taskosaur.taskosaur.repositories.ActivityLogRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

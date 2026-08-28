package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.services.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/organization/{organizationId}/recent")
    public ResponseEntity<Map<String, Object>> getOrganizationRecentActivity(
            @PathVariable String organizationId,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "userId", required = false) String userId
    ) {
        return ResponseEntity.ok(activityLogService.getRecentActivityByOrganization(organizationId, limit, page, entityType, userId));
    }

    @GetMapping("/organization/{organizationId}/stats")
    public ResponseEntity<Map<String, Object>> getOrganizationActivityStats(
            @PathVariable String organizationId,
            @RequestParam(name = "days", defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(activityLogService.getOrganizationStats(organizationId, days));
    }

    @GetMapping("/task/{taskId}/activities")
    public ResponseEntity<Map<String, Object>> getTaskActivities(
            @PathVariable String taskId,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "page", defaultValue = "1") int page
    ) {
        return ResponseEntity.ok(activityLogService.getTaskActivities(taskId, limit, page));
    }

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> getActivities(
            @RequestParam(name = "organizationId", required = false) String organizationId
    ) {
        if (organizationId != null && !organizationId.isBlank()) {
            return ResponseEntity.ok(activityLogService.getActivitiesByOrganization(organizationId));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/entity/{entityId}")
    public ResponseEntity<List<ActivityLogResponse>> getEntityActivities(@PathVariable String entityId) {
        return ResponseEntity.ok(activityLogService.getActivitiesByEntity(entityId));
    }
}

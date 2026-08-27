package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.activity.ActivityLogResponse;
import com.taskosaur.taskosaur.services.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

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

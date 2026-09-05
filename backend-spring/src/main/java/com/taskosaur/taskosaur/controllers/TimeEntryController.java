package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.timeentry.*;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.services.TimeEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/time-entries")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    @PostMapping
    public ResponseEntity<TimeEntryResponse> create(
            @Valid @RequestBody CreateTimeEntryRequest request,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        TimeEntryResponse response = timeEntryService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TimeEntryResponse>> findAll(
            @RequestParam(required = false) String taskId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication
    ) {
        String currentUserId = getUserId(authentication);
        List<TimeEntryResponse> list = timeEntryService.findAll(taskId, userId, startDate, endDate, currentUserId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/active")
    public ResponseEntity<TimeEntryResponse> getActiveTimer(Authentication authentication) {
        String userId = getUserId(authentication);
        TimeEntryResponse activeTimer = timeEntryService.getActiveTimer(userId);
        return ResponseEntity.ok(activeTimer);
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startTimer(
            @Valid @RequestBody StartTimerRequest request,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        TimeEntryResponse response = timeEntryService.startTimer(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Timer started successfully",
                "activeTimer", response
        ));
    }

    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stopTimer(
            @RequestBody(required = false) StopTimerRequest request,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        TimeEntryResponse response = timeEntryService.stopTimer(request, userId);
        return ResponseEntity.ok(Map.of(
                "message", "Timer stopped successfully",
                "timeEntry", response
        ));
    }

    @GetMapping("/summary")
    public ResponseEntity<TimeSpentSummaryResponse> getSummary(
            @RequestParam(required = false) String taskId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication
    ) {
        String currentUserId = getUserId(authentication);
        TimeSpentSummaryResponse summary = timeEntryService.getTimeSpentSummary(taskId, userId, startDate, endDate, currentUserId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimeEntryResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(timeEntryService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimeEntryResponse> update(
            @PathVariable String id,
            @RequestBody UpdateTimeEntryRequest request,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        return ResponseEntity.ok(timeEntryService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        timeEntryService.delete(id, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Time entry deleted successfully"
        ));
    }

    private String getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }
        return authentication.getName();
    }
}

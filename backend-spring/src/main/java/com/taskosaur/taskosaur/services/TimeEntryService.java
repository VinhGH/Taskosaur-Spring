package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.timeentry.*;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ForbiddenException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TimeEntry;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.repositories.TimeEntryRepository;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WebSocketEventService webSocketEventService;

    @Transactional
    public TimeEntryResponse create(CreateTimeEntryRequest request, String userId) {
        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + request.getTaskId()));

        Integer timeSpent = request.getTimeSpent() != null ? request.getTimeSpent() : 0;
        if (request.getStartTime() != null && request.getEndTime() != null) {
            if (request.getEndTime().isBefore(request.getStartTime())) {
                throw new BadRequestException("End time must be after start time");
            }
            long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
            timeSpent = (int) Math.max(1, minutes);
        }

        LocalDateTime date = request.getDate() != null ? request.getDate() : LocalDateTime.now();

        TimeEntry entry = TimeEntry.builder()
                .taskId(task.getId())
                .userId(userId)
                .description(request.getDescription())
                .timeSpent(timeSpent)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .date(date)
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        TimeEntry saved = timeEntryRepository.save(entry);
        TimeEntryResponse response = mapToResponse(saved, task, null);

        webSocketEventService.notifyTaskUpdated(task.getProjectId(), task.getId(),
                Map.of("type", "time_entry_created", "timeEntry", response));

        return response;
    }

    public List<TimeEntryResponse> findAll(String taskId, String userId, LocalDateTime startDate, LocalDateTime endDate, String requestingUserId) {
        List<TimeEntry> entries;

        if (taskId != null && !taskId.isBlank()) {
            if (startDate != null && endDate != null) {
                if (userId != null && !userId.isBlank()) {
                    entries = timeEntryRepository.findByTaskIdAndUserIdAndDateRange(taskId, userId, startDate, endDate);
                } else {
                    entries = timeEntryRepository.findByTaskIdAndDateRange(taskId, startDate, endDate);
                }
            } else {
                if (userId != null && !userId.isBlank()) {
                    entries = timeEntryRepository.findByTaskIdAndUserIdOrderByCreatedAtDesc(taskId, userId);
                } else {
                    entries = timeEntryRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
                }
            }
        } else {
            String targetUserId = (userId != null && !userId.isBlank()) ? userId : requestingUserId;
            if (startDate != null && endDate != null) {
                entries = timeEntryRepository.findByUserIdAndDateRange(targetUserId, startDate, endDate);
            } else {
                entries = timeEntryRepository.findByUserIdOrderByCreatedAtDesc(targetUserId);
            }
        }

        return mapToResponses(entries);
    }

    public TimeEntryResponse findById(String id) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + id));
        return mapToResponse(entry, null, null);
    }

    @Transactional
    public TimeEntryResponse update(String id, UpdateTimeEntryRequest request, String requestingUserId) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + id));

        if (!entry.getUserId().equals(requestingUserId)) {
            throw new ForbiddenException("You can only edit your own time entries");
        }

        if (request.getDescription() != null) {
            entry.setDescription(request.getDescription());
        }
        if (request.getDate() != null) {
            entry.setDate(request.getDate());
        }
        if (request.getStartTime() != null) {
            entry.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            entry.setEndTime(request.getEndTime());
        }

        if (entry.getStartTime() != null && entry.getEndTime() != null) {
            if (entry.getEndTime().isBefore(entry.getStartTime())) {
                throw new BadRequestException("End time must be after start time");
            }
            long minutes = Duration.between(entry.getStartTime(), entry.getEndTime()).toMinutes();
            entry.setTimeSpent((int) Math.max(1, minutes));
        } else if (request.getTimeSpent() != null) {
            entry.setTimeSpent(request.getTimeSpent());
        }

        entry.setUpdatedBy(requestingUserId);
        TimeEntry updated = timeEntryRepository.save(entry);
        return mapToResponse(updated, null, null);
    }

    @Transactional
    public void delete(String id, String requestingUserId) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with ID: " + id));

        if (!entry.getUserId().equals(requestingUserId)) {
            throw new ForbiddenException("You can only delete your own time entries");
        }

        timeEntryRepository.delete(entry);
    }

    @Transactional
    public TimeEntryResponse startTimer(StartTimerRequest request, String userId) {
        // Check if user already has an active timer
        Optional<TimeEntry> existing = timeEntryRepository.findFirstByUserIdAndStartTimeIsNotNullAndEndTimeIsNull(userId);
        if (existing.isPresent()) {
            throw new BadRequestException("You already have an active timer running. Stop it before starting a new one.");
        }

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + request.getTaskId()));

        TimeEntry entry = TimeEntry.builder()
                .taskId(task.getId())
                .userId(userId)
                .description(request.getDescription())
                .timeSpent(0)
                .startTime(LocalDateTime.now())
                .endTime(null)
                .date(LocalDateTime.now())
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        TimeEntry saved = timeEntryRepository.save(entry);
        TimeEntryResponse response = mapToResponse(saved, task, null);

        webSocketEventService.notifyTimeStarted(task.getProjectId(), task.getId(), response);
        log.info("Started timer for user {} on task {}", userId, task.getId());
        return response;
    }

    @Transactional
    public TimeEntryResponse stopTimer(StopTimerRequest request, String userId) {
        TimeEntry activeTimer;
        if (request != null && request.getTaskId() != null && !request.getTaskId().isBlank()) {
            activeTimer = timeEntryRepository.findFirstByUserIdAndStartTimeIsNotNullAndEndTimeIsNull(userId)
                    .filter(t -> t.getTaskId().equals(request.getTaskId()))
                    .orElseThrow(() -> new ResourceNotFoundException("No active timer found for task " + request.getTaskId()));
        } else {
            activeTimer = timeEntryRepository.findFirstByUserIdAndStartTimeIsNotNullAndEndTimeIsNull(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("No active timer found for this user"));
        }

        LocalDateTime endTime = LocalDateTime.now();
        activeTimer.setEndTime(endTime);

        long minutes = 0;
        if (activeTimer.getStartTime() != null) {
            minutes = Math.max(1, Duration.between(activeTimer.getStartTime(), endTime).toMinutes());
        }
        activeTimer.setTimeSpent((int) minutes);

        if (request != null && request.getDescription() != null && !request.getDescription().isBlank()) {
            activeTimer.setDescription(request.getDescription());
        }
        activeTimer.setUpdatedBy(userId);

        TimeEntry saved = timeEntryRepository.save(activeTimer);
        Task task = taskRepository.findById(saved.getTaskId()).orElse(null);
        TimeEntryResponse response = mapToResponse(saved, task, null);

        if (task != null) {
            webSocketEventService.notifyTimeStopped(task.getProjectId(), task.getId(), response);
        }

        log.info("Stopped timer for user {}. Total duration: {} minutes", userId, minutes);
        return response;
    }

    public TimeEntryResponse getActiveTimer(String userId) {
        return timeEntryRepository.findFirstByUserIdAndStartTimeIsNotNullAndEndTimeIsNull(userId)
                .map(entry -> mapToResponse(entry, null, null))
                .orElse(null);
    }

    public TimeSpentSummaryResponse getTimeSpentSummary(String taskId, String userId, LocalDateTime startDate, LocalDateTime endDate, String requestingUserId) {
        List<TimeEntryResponse> entries = findAll(taskId, userId, startDate, endDate, requestingUserId);

        int totalMinutes = entries.stream()
                .mapToInt(e -> e.getTimeSpent() != null ? e.getTimeSpent() : 0)
                .sum();
        double totalHours = Math.round((totalMinutes / 60.0) * 100.0) / 100.0;

        // Group by Task
        Map<String, List<TimeEntryResponse>> byTask = entries.stream()
                .filter(e -> e.getTaskId() != null)
                .collect(Collectors.groupingBy(TimeEntryResponse::getTaskId));

        List<TimeSpentSummaryResponse.TaskTimeSummary> taskSummaryList = byTask.entrySet().stream()
                .map(e -> {
                    List<TimeEntryResponse> list = e.getValue();
                    int tMins = list.stream().mapToInt(item -> item.getTimeSpent() != null ? item.getTimeSpent() : 0).sum();
                    TimeEntryResponse first = list.get(0);
                    String title = first.getTask() != null ? first.getTask().getTitle() : "Task " + e.getKey();
                    String slug = first.getTask() != null ? first.getTask().getSlug() : "";
                    return TimeSpentSummaryResponse.TaskTimeSummary.builder()
                            .taskId(e.getKey())
                            .taskTitle(title)
                            .taskSlug(slug)
                            .totalMinutes(tMins)
                            .totalHours(Math.round((tMins / 60.0) * 100.0) / 100.0)
                            .entryCount(list.size())
                            .build();
                })
                .collect(Collectors.toList());

        // Group by User
        Map<String, List<TimeEntryResponse>> byUser = entries.stream()
                .filter(e -> e.getUserId() != null)
                .collect(Collectors.groupingBy(TimeEntryResponse::getUserId));

        List<TimeSpentSummaryResponse.UserTimeSummary> userSummaryList = byUser.entrySet().stream()
                .map(e -> {
                    List<TimeEntryResponse> list = e.getValue();
                    int uMins = list.stream().mapToInt(item -> item.getTimeSpent() != null ? item.getTimeSpent() : 0).sum();
                    TimeEntryResponse first = list.get(0);
                    String name = "User";
                    String avatar = null;
                    if (first.getUser() != null) {
                        name = (first.getUser().getFirstName() + " " + first.getUser().getLastName()).trim();
                        avatar = first.getUser().getAvatar();
                    }
                    return TimeSpentSummaryResponse.UserTimeSummary.builder()
                            .userId(e.getKey())
                            .userName(name)
                            .userAvatar(avatar)
                            .totalMinutes(uMins)
                            .totalHours(Math.round((uMins / 60.0) * 100.0) / 100.0)
                            .entryCount(list.size())
                            .build();
                })
                .collect(Collectors.toList());

        return TimeSpentSummaryResponse.builder()
                .totalTimeSpent(totalMinutes)
                .totalTimeSpentHours(totalHours)
                .totalEntries(entries.size())
                .taskSummary(taskSummaryList)
                .userSummary(userSummaryList)
                .entries(entries)
                .build();
    }

    private List<TimeEntryResponse> mapToResponses(List<TimeEntry> entries) {
        if (entries == null || entries.isEmpty()) return Collections.emptyList();

        Set<String> taskIds = entries.stream().map(TimeEntry::getTaskId).collect(Collectors.toSet());
        Set<String> userIds = entries.stream().map(TimeEntry::getUserId).collect(Collectors.toSet());

        Map<String, Task> taskMap = taskRepository.findAllById(taskIds).stream()
                .collect(Collectors.toMap(Task::getId, t -> t));
        Map<String, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return entries.stream()
                .map(entry -> mapToResponse(entry, taskMap.get(entry.getTaskId()), userMap.get(entry.getUserId())))
                .collect(Collectors.toList());
    }

    private TimeEntryResponse mapToResponse(TimeEntry entry, Task task, User user) {
        if (task == null && entry.getTaskId() != null) {
            task = taskRepository.findById(entry.getTaskId()).orElse(null);
        }
        if (user == null && entry.getUserId() != null) {
            user = userRepository.findById(entry.getUserId()).orElse(null);
        }

        TimeEntryResponse.TaskSummaryDto taskDto = null;
        if (task != null) {
            taskDto = TimeEntryResponse.TaskSummaryDto.builder()
                    .id(task.getId())
                    .title(task.getTitle())
                    .slug(task.getSlug())
                    .taskNumber(task.getTaskNumber())
                    .projectId(task.getProjectId())
                    .build();
        }

        TimeEntryResponse.UserSummaryDto userDto = null;
        if (user != null) {
            userDto = TimeEntryResponse.UserSummaryDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .avatar(user.getAvatar())
                    .build();
        }

        return TimeEntryResponse.builder()
                .id(entry.getId())
                .description(entry.getDescription())
                .timeSpent(entry.getTimeSpent())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .date(entry.getDate())
                .taskId(entry.getTaskId())
                .userId(entry.getUserId())
                .task(taskDto)
                .user(userDto)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}

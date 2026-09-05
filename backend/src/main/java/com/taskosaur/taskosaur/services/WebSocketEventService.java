package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.task.TaskResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketEventService {

    public record WebSocketMessage(String event, Object data, String timestamp) {}

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyTaskCreated(String projectId, TaskResponse task) {
        if (projectId == null) return;
        WebSocketMessage message = buildMessage("task:created", task);
        messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        log.debug("Sent task:created to /topic/project/{}", projectId);
    }

    public void notifyTaskStatusChanged(String projectId, String taskId, Object statusChange) {
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("statusChange", statusChange);
        WebSocketMessage message = buildMessage("task:status_changed", data);

        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        }
        if (taskId != null) {
            messagingTemplate.convertAndSend("/topic/task/" + taskId, message);
        }
        log.debug("Sent task:status_changed for task {}", taskId);
    }

    public void notifyTaskUpdated(String projectId, String taskId, Object updates) {
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("updates", updates);
        WebSocketMessage message = buildMessage("task:updated", data);

        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        }
        if (taskId != null) {
            messagingTemplate.convertAndSend("/topic/task/" + taskId, message);
        }
        log.debug("Sent task:updated for task {}", taskId);
    }

    public void notifyTaskDeleted(String projectId, String taskId) {
        if (projectId == null) return;
        Map<String, Object> data = Map.of("taskId", taskId);
        WebSocketMessage message = buildMessage("task:deleted", data);
        messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        log.debug("Sent task:deleted to /topic/project/{}", projectId);
    }

    public void notifyCommentAdded(String projectId, String taskId, Object comment) {
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("comment", comment);
        WebSocketMessage message = buildMessage("comment:added", data);

        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        }
        if (taskId != null) {
            messagingTemplate.convertAndSend("/topic/task/" + taskId, message);
        }
        log.debug("Sent comment:added for task {}", taskId);
    }

    public void notifyUserNotification(String userId, Object notification, long unreadCount) {
        if (userId == null) return;
        Map<String, Object> data = new HashMap<>();
        data.put("notification", notification);
        data.put("unreadCount", unreadCount);
        WebSocketMessage message = buildMessage("notification", data);

        messagingTemplate.convertAndSend("/topic/user/" + userId, message);
        log.info("Sent real-time notification to /topic/user/{}", userId);
    }

    public void notifyTimeStarted(String projectId, String taskId, Object timeEntry) {
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("timeEntry", timeEntry);
        WebSocketMessage message = buildMessage("time:started", data);

        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        }
        if (taskId != null) {
            messagingTemplate.convertAndSend("/topic/task/" + taskId, message);
        }
        log.debug("Sent time:started for task {}", taskId);
    }

    public void notifyTimeStopped(String projectId, String taskId, Object timeEntry) {
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("timeEntry", timeEntry);
        WebSocketMessage message = buildMessage("time:stopped", data);

        if (projectId != null) {
            messagingTemplate.convertAndSend("/topic/project/" + projectId, message);
        }
        if (taskId != null) {
            messagingTemplate.convertAndSend("/topic/task/" + taskId, message);
        }
        log.debug("Sent time:stopped for task {}", taskId);
    }

    private WebSocketMessage buildMessage(String event, Object data) {
        return new WebSocketMessage(event, data, Instant.now().toString());
    }
}

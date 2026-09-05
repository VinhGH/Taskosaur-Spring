package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.task.TaskResponse;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.PublicTaskShare;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskAttachment;
import com.taskosaur.taskosaur.models.TaskComment;
import com.taskosaur.taskosaur.repositories.PublicTaskShareRepository;
import com.taskosaur.taskosaur.repositories.TaskAttachmentRepository;
import com.taskosaur.taskosaur.repositories.TaskCommentRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import com.taskosaur.taskosaur.services.TaskAttachmentService;
import com.taskosaur.taskosaur.services.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class PublicTaskController {

    private final PublicTaskShareRepository publicTaskShareRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskAttachmentService taskAttachmentService;
    private final com.taskosaur.taskosaur.repositories.UserRepository userRepository;

    @GetMapping("/tasks/{token}")
    public ResponseEntity<Map<String, Object>> getPublicTaskByToken(@PathVariable String token) {
        PublicTaskShare share = publicTaskShareRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired share token"));

        if (share.getRevokedAt() != null || share.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new ResourceNotFoundException("This share link has expired or been revoked");
        }

        TaskResponse task = taskService.getTaskById(share.getTaskId());

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", task.getId());
        response.put("title", task.getTitle());
        response.put("description", task.getDescription());
        response.put("type", task.getType());
        response.put("priority", task.getPriority());
        response.put("taskNumber", task.getTaskNumber());
        response.put("slug", task.getSlug());
        response.put("startDate", task.getStartDate());
        response.put("dueDate", task.getDueDate());
        response.put("completedAt", task.getCompletedAt());
        response.put("storyPoints", task.getStoryPoints());
        response.put("status", task.getStatus());
        response.put("assignees", task.getAssignees());
        response.put("labels", task.getLabels());
        response.put("project", task.getProject());
        response.put("createdAt", task.getCreatedAt());

        if (task.getCreatedBy() != null) {
            userRepository.findById(task.getCreatedBy()).ifPresent(u -> {
                Map<String, Object> userMap = new java.util.HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("firstName", u.getFirstName());
                userMap.put("lastName", u.getLastName());
                userMap.put("avatar", u.getAvatar() != null ? u.getAvatar() : "");
                response.put("createdBy", userMap);
            });
        }

        List<TaskAttachment> attachments = taskAttachmentRepository.findByTaskIdOrderByCreatedAtDesc(task.getId());
        List<Map<String, Object>> attachmentDtos = attachments.stream().map(a -> {
            Map<String, Object> attMap = new java.util.HashMap<>();
            attMap.put("id", a.getId());
            attMap.put("fileName", a.getFileName());
            attMap.put("fileSize", a.getFileSize() != null ? a.getFileSize() : 0);
            attMap.put("mimeType", a.getMimeType() != null ? a.getMimeType() : "application/octet-stream");
            attMap.put("url", a.getUrl() != null ? a.getUrl() : "");
            return attMap;
        }).toList();
        response.put("attachments", attachmentDtos);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/tasks/{token}/attachments/{attachmentId}")
    public ResponseEntity<Map<String, String>> getPublicAttachmentUrl(
            @PathVariable String token,
            @PathVariable String attachmentId
    ) {
        PublicTaskShare share = publicTaskShareRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired share token"));

        if (share.getRevokedAt() != null || share.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new ResourceNotFoundException("This share link has expired or been revoked");
        }

        TaskAttachment attachment = taskAttachmentService.getAttachmentById(attachmentId);
        return ResponseEntity.ok(Map.of("url", attachment.getUrl() != null ? attachment.getUrl() : ""));
    }

    @GetMapping("/project-tasks/{idOrSlug}")
    public ResponseEntity<TaskResponse> getPublicProjectTask(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(taskService.getTaskById(idOrSlug));
    }

    @GetMapping("/project-tasks/slug/{slug}")
    public ResponseEntity<TaskResponse> getPublicProjectTaskBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(taskService.getTaskBySlug(slug));
    }

    @GetMapping("/project-tasks/{workspaceSlug}/projects/{projectSlug}/tasks")
    public ResponseEntity<Map<String, Object>> getPublicProjectTasks(
            @PathVariable String workspaceSlug,
            @PathVariable String projectSlug
    ) {
        return ResponseEntity.ok(Map.of("tasks", List.of(), "total", 0));
    }

    @GetMapping("/project-tasks/comments/{taskId}")
    public ResponseEntity<List<TaskComment>> getPublicComments(@PathVariable String taskId) {
        return ResponseEntity.ok(taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId));
    }

    @GetMapping("/project-tasks/attachments/{taskId}")
    public ResponseEntity<List<TaskAttachment>> getPublicAttachments(@PathVariable String taskId) {
        return ResponseEntity.ok(taskAttachmentRepository.findByTaskIdOrderByCreatedAtDesc(taskId));
    }

    @GetMapping("/project-tasks/activities/{taskId}")
    public ResponseEntity<Map<String, Object>> getPublicActivities(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(Map.of("activities", List.of(), "total", 0, "page", page, "limit", limit));
    }
}

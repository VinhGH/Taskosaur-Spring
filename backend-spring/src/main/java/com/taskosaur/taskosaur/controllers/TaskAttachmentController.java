package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.models.TaskAttachment;
import com.taskosaur.taskosaur.services.TaskAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/task-attachments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class TaskAttachmentController {

    private final TaskAttachmentService taskAttachmentService;

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TaskAttachment>> getAttachments(@PathVariable String taskId) {
        return ResponseEntity.ok(taskAttachmentService.getAttachmentsByTask(taskId));
    }

    @PostMapping
    public ResponseEntity<TaskAttachment> createAttachment(
            @RequestParam("taskId") String taskId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskAttachment attachment = taskAttachmentService.uploadAttachment(taskId, file, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    @PostMapping("/upload/{taskId}")
    public ResponseEntity<TaskAttachment> upload(
            @PathVariable String taskId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {
        String currentUserId = authentication != null ? authentication.getName() : null;
        TaskAttachment attachment = taskAttachmentService.uploadAttachment(taskId, file, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String, Object>> getStats(@RequestParam(required = false) String organizationId) {
        return ResponseEntity.ok(taskAttachmentService.getAttachmentStats(organizationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskAttachment> getById(@PathVariable String id) {
        return ResponseEntity.ok(taskAttachmentService.getAttachmentById(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String id) {
        TaskAttachment attachment = taskAttachmentService.getAttachmentById(id);
        org.springframework.core.io.Resource resource = taskAttachmentService.loadAsResource(id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType(attachment.getMimeType() != null ? attachment.getMimeType() : "application/octet-stream"))
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<org.springframework.core.io.Resource> preview(@PathVariable String id) {
        TaskAttachment attachment = taskAttachmentService.getAttachmentById(id);
        org.springframework.core.io.Resource resource = taskAttachmentService.loadAsResource(id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType(attachment.getMimeType() != null ? attachment.getMimeType() : "application/octet-stream"))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        taskAttachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}

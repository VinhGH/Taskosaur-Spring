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

    @GetMapping("/{id}")
    public ResponseEntity<TaskAttachment> getById(@PathVariable String id) {
        return ResponseEntity.ok(taskAttachmentService.getAttachmentById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        taskAttachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}

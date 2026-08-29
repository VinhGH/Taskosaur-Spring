package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.models.TaskAttachment;
import com.taskosaur.taskosaur.repositories.TaskAttachmentRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskAttachmentService {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );

    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskRepository taskRepository;

    public List<TaskAttachment> getAttachmentsByTask(String taskIdOrSlug) {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        return taskAttachmentRepository.findByTaskIdOrderByCreatedAtDesc(effectiveTaskId);
    }

    public TaskAttachment uploadAttachment(String taskIdOrSlug, MultipartFile file, String userId) throws IOException {
        String effectiveTaskId = resolveTaskId(taskIdOrSlug);
        String uploadsDir = "uploads/attachments";
        Path uploadPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String storedFileName = UUID.randomUUID() + extension;
        Path targetPath = uploadPath.resolve(storedFileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        String fileUrl = "/uploads/attachments/" + storedFileName;

        TaskAttachment attachment = TaskAttachment.builder()
                .fileName(originalFilename)
                .filePath(targetPath.toString())
                .fileSize((int) file.getSize())
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .url(fileUrl)
                .storageKey(storedFileName)
                .taskId(effectiveTaskId)
                .createdBy(userId)
                .updatedBy(userId)
                .build();

        return taskAttachmentRepository.save(attachment);
    }

    public TaskAttachment getAttachmentById(String id) {
        return taskAttachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + id));
    }

    public void deleteAttachment(String id) {
        TaskAttachment attachment = getAttachmentById(id);
        if (attachment.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (Exception ignored) {
            }
        }
        taskAttachmentRepository.delete(attachment);
    }

    public org.springframework.core.io.Resource loadAsResource(String id) {
        TaskAttachment attachment = getAttachmentById(id);
        if (attachment.getFilePath() != null) {
            Path file = Paths.get(attachment.getFilePath());
            if (Files.exists(file)) {
                return new org.springframework.core.io.FileSystemResource(file);
            }
        }
        throw new ResourceNotFoundException("Attachment file not found on disk");
    }

    public java.util.Map<String, Object> getAttachmentStats(String organizationId) {
        List<TaskAttachment> all = taskAttachmentRepository.findAll();
        long totalSize = all.stream().mapToLong(TaskAttachment::getFileSize).sum();
        return java.util.Map.of(
                "totalCount", all.size(),
                "totalSize", totalSize,
                "totalSizeBytes", totalSize
        );
    }

    private String resolveTaskId(String taskIdOrSlug) {
        if (taskIdOrSlug == null || taskIdOrSlug.isBlank()) {
            throw new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug);
        }
        if (UUID_PATTERN.matcher(taskIdOrSlug).matches()) {
            return taskRepository.findById(taskIdOrSlug)
                    .map(Task::getId)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug));
        }
        return taskRepository.findBySlug(taskIdOrSlug)
                .map(Task::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskIdOrSlug));
    }
}

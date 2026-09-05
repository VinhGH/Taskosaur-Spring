package com.taskosaur.taskosaur.controllers;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/uploads", "/uploads"})
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class UploadController {

    private static final String UPLOAD_BASE_DIR = "uploads";

    @PostMapping("/upload/{folder}")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @PathVariable String folder,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No file uploaded"));
        }

        String safeFolder = sanitizePath(folder);
        Path targetDir = Paths.get(UPLOAD_BASE_DIR, safeFolder).toAbsolutePath().normalize();
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String safeFileName = System.currentTimeMillis() + "-" + UUID.randomUUID() + extension;
        Path targetFile = targetDir.resolve(safeFileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
        }

        String relativePath = safeFolder + "/" + safeFileName;

        Map<String, Object> response = new HashMap<>();
        response.put("message", "File uploaded successfully");
        response.put("url", relativePath);
        response.put("key", relativePath);
        response.put("size", file.getSize());
        response.put("inCloud", false);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{folder}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String folder,
            @PathVariable String filename
    ) {
        String safeFolder = sanitizePath(folder);
        String safeFilename = sanitizePath(filename);
        Path filePath = Paths.get(UPLOAD_BASE_DIR, safeFolder, safeFilename).toAbsolutePath().normalize();

        File file = filePath.toFile();
        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        MediaType mediaType = resolveMediaType(safeFilename);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                .body(resource);
    }

    @GetMapping("/tasks/{taskId}/{filename}")
    public ResponseEntity<Resource> serveTaskFile(
            @PathVariable String taskId,
            @PathVariable String filename
    ) {
        String safeTaskId = sanitizePath(taskId);
        String safeFilename = sanitizePath(filename);
        Path filePath = Paths.get(UPLOAD_BASE_DIR, "tasks", safeTaskId, safeFilename).toAbsolutePath().normalize();

        File file = filePath.toFile();
        if (!file.exists()) {
            filePath = Paths.get(UPLOAD_BASE_DIR, "attachments", safeFilename).toAbsolutePath().normalize();
            file = filePath.toFile();
        }

        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        MediaType mediaType = resolveMediaType(safeFilename);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                .body(resource);
    }

    @GetMapping("/editor-images/{filename}")
    public ResponseEntity<Resource> serveEditorImage(@PathVariable String filename) {
        String safeFilename = sanitizePath(filename);
        Path filePath = Paths.get(UPLOAD_BASE_DIR, "editor-images", safeFilename).toAbsolutePath().normalize();

        File file = filePath.toFile();
        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        MediaType mediaType = resolveMediaType(safeFilename);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                .body(resource);
    }

    private String sanitizePath(String path) {
        if (path == null) return "";
        return path.replaceAll("[^a-zA-Z0-9._-]", "");
    }

    private MediaType resolveMediaType(String filename) {
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.valueOf("image/webp");
            case "svg" -> MediaType.valueOf("image/svg+xml");
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "json" -> MediaType.APPLICATION_JSON;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}

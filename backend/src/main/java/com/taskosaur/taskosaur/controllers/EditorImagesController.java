package com.taskosaur.taskosaur.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
@RequestMapping("/api/editor-images")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class EditorImagesController {

    private static final String UPLOAD_BASE_DIR = "uploads";
    private static final String FOLDER = "editor-images";

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "No file uploaded",
                    "id", null,
                    "url", null,
                    "key", null,
                    "size", 0,
                    "inCloud", false
            ));
        }

        // Tạo thư mục uploads/editor-images nếu chưa tồn tại
        Path targetDir = Paths.get(UPLOAD_BASE_DIR, FOLDER).toAbsolutePath().normalize();
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        // Lấy đuôi mở rộng file
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        // Tạo tên file an toàn duy nhất
        String safeFileName = System.currentTimeMillis() + "-" + UUID.randomUUID() + extension;
        Path targetFile = targetDir.resolve(safeFileName);

        // Lưu file vào đĩa
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
        }

        String assetId = UUID.randomUUID().toString();
        String relativePath = "/" + FOLDER + "/" + safeFileName;
        String storageKey = FOLDER + "/" + safeFileName;

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Image uploaded successfully");
        response.put("id", assetId);
        response.put("url", relativePath);
        response.put("key", storageKey);
        response.put("size", file.getSize());
        response.put("inCloud", false);

        log.info("Editor image uploaded: {} (size: {} bytes)", storageKey, file.getSize());

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.PublicTaskShare;
import com.taskosaur.taskosaur.models.Task;
import com.taskosaur.taskosaur.repositories.PublicTaskShareRepository;
import com.taskosaur.taskosaur.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task-shares")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class TaskShareController {

    private final PublicTaskShareRepository publicTaskShareRepository;
    private final TaskRepository taskRepository;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShare(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        String taskId = (String) body.get("taskId");
        Number expiresInDaysNum = (Number) body.getOrDefault("expiresInDays", 7);
        int expiresInDays = expiresInDaysNum != null ? expiresInDaysNum.intValue() : 7;

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String currentUserId = authentication != null ? authentication.getName() : null;
        LocalDateTime expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusDays(expiresInDays);

        PublicTaskShare share = PublicTaskShare.builder()
                .token(token)
                .expiresAt(expiresAt)
                .taskId(task.getId())
                .createdBy(currentUserId)
                .build();

        PublicTaskShare saved = publicTaskShareRepository.save(share);

        String shareUrl = frontendUrl + "/public/task/" + token;

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "token", saved.getToken(),
                "shareUrl", shareUrl,
                "expiresAt", saved.getExpiresAt().toString(),
                "createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString()
        ));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<Map<String, String>>> getSharesForTask(@PathVariable String taskId) {
        List<PublicTaskShare> shares = publicTaskShareRepository.findByTaskId(taskId);
        List<Map<String, String>> result = shares.stream()
                .filter(s -> s.getRevokedAt() == null)
                .map(s -> Map.of(
                        "id", s.getId(),
                        "token", s.getToken(),
                        "shareUrl", frontendUrl + "/public/task/" + s.getToken(),
                        "expiresAt", s.getExpiresAt().toString(),
                        "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> revokeShare(@PathVariable String id) {
        publicTaskShareRepository.findById(id).ifPresent(share -> {
            share.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));
            publicTaskShareRepository.save(share);
        });
        return ResponseEntity.ok(Map.of("success", true, "message", "Share link revoked successfully"));
    }
}

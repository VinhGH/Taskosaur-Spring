package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.github.*;
import com.taskosaur.taskosaur.services.GithubSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/github-sync")
@RequiredArgsConstructor
public class GithubSyncController {

    private final GithubSyncService githubSyncService;

    @PostMapping("/validate/repos")
    public ResponseEntity<List<GithubRepoResponse>> validateAndListRepos(
            @RequestBody ValidateGithubTokenRequest request
    ) {
        return ResponseEntity.ok(githubSyncService.validateAndListRepos(request.getToken()));
    }

    @PostMapping("/connect")
    public ResponseEntity<GithubSyncStatusResponse> connect(
            Authentication authentication,
            @RequestBody ConnectGithubRequest request
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(githubSyncService.connect(request, userId));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<GithubSyncStatusResponse> getStatus(
            @PathVariable String projectId
    ) {
        GithubSyncStatusResponse status = githubSyncService.getStatus(projectId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<GithubSyncStatusResponse> updateSync(
            Authentication authentication,
            @PathVariable String projectId,
            @RequestBody UpdateGithubSyncRequest request
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(githubSyncService.updateSync(projectId, request, userId));
    }

    @PostMapping("/{projectId}/sync")
    public ResponseEntity<GithubSyncStatusResponse> syncNow(
            Authentication authentication,
            @PathVariable String projectId
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(githubSyncService.syncNow(projectId, userId));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Map<String, String>> disconnect(
            @PathVariable String projectId
    ) {
        githubSyncService.disconnect(projectId);
        return ResponseEntity.ok(Map.of("message", "GitHub sync disconnected successfully"));
    }
}

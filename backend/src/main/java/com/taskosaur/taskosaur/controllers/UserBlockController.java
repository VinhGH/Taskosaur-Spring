package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.chat.BlockUserRequest;
import com.taskosaur.taskosaur.dto.chat.UserBlockResponse;
import com.taskosaur.taskosaur.services.ChatService;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/blocks")
@RequiredArgsConstructor
public class UserBlockController {

    private final ChatService chatService;

    private String requireCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return authentication.getName();
    }

    @GetMapping
    public ResponseEntity<List<UserBlockResponse>> getBlockedUsers(Authentication authentication) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getBlockedUsers(currentUserId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> blockUser(
            @Valid @RequestBody BlockUserRequest request,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.blockUser(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "blockedId", request.getBlockedId()));
    }

    @DeleteMapping("/{blockedId}")
    public ResponseEntity<Map<String, Object>> unblockUser(
            @PathVariable String blockedId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.unblockUser(blockedId, currentUserId);
        return ResponseEntity.ok(Map.of("success", true, "unblockedId", blockedId));
    }
}

package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.chat.MessageResponse;
import com.taskosaur.taskosaur.dto.chat.SendMessageRequest;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/channels/{channelId}/messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatService chatService;

    private String requireCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return authentication.getName();
    }

    @GetMapping
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getChannelMessages(channelId, currentUserId, page, size));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String channelId,
            @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        MessageResponse sent = chatService.sendMessage(channelId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Map<String, Object>> deleteMessage(
            @PathVariable String channelId,
            @PathVariable String messageId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.deleteMessage(channelId, messageId, currentUserId);
        return ResponseEntity.ok(Map.of("success", true, "messageId", messageId));
    }

    @PostMapping("/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.markAsRead(channelId, currentUserId);
        return ResponseEntity.ok(Map.of("success", true));
    }
}

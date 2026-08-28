package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.ai.*;
import com.taskosaur.taskosaur.services.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class AiChatController {

    private final AiChatService aiChatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponseDto>> getConversations(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(aiChatService.getConversations(userId));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponseDto> createConversation(
            Authentication authentication,
            @RequestBody(required = false) CreateConversationDto dto
    ) {
        String userId = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiChatService.createConversation(userId, dto));
    }

    @PatchMapping("/conversations/{id}")
    public ResponseEntity<ConversationResponseDto> renameConversation(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody RenameConversationDto dto
    ) {
        String userId = authentication.getName();
        return ResponseEntity.ok(aiChatService.renameConversation(userId, id, dto));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            Authentication authentication,
            @PathVariable String id
    ) {
        String userId = authentication.getName();
        aiChatService.deleteConversation(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/conversations/{id}/messages")
    public ResponseEntity<ConversationResponseDto> updateMessages(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UpdateMessagesDto dto
    ) {
        String userId = authentication.getName();
        return ResponseEntity.ok(aiChatService.updateMessages(userId, id, dto));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDto> chat(
            Authentication authentication,
            @Valid @RequestBody ChatRequestDto chatRequest
    ) {
        String userId = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.ok(aiChatService.chat(chatRequest, userId));
    }

    @PostMapping("/test-connection")
    public ResponseEntity<TestConnectionResponseDto> testConnection(
            @Valid @RequestBody TestConnectionDto testConnectionDto
    ) {
        return ResponseEntity.ok(aiChatService.testConnection(testConnectionDto));
    }

    @PostMapping("/generate-description")
    public ResponseEntity<GenerateDescriptionResponseDto> generateDescription(
            Authentication authentication,
            @Valid @RequestBody GenerateDescriptionDto dto
    ) {
        String userId = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.ok(aiChatService.generateDescription(dto, userId));
    }

    @DeleteMapping("/context/{sessionId}")
    public ResponseEntity<Map<String, Boolean>> clearContext(
            Authentication authentication,
            @PathVariable String sessionId
    ) {
        String userId = authentication.getName();
        return ResponseEntity.ok(aiChatService.clearContext(userId, sessionId));
    }
}

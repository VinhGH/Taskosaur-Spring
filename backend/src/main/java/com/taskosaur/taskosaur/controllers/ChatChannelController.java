package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.chat.*;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/channels")
@RequiredArgsConstructor
public class ChatChannelController {

    private final ChatService chatService;

    private String requireCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return authentication.getName();
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<ChannelResponse>> getWorkspaceChannels(
            @PathVariable String workspaceId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getWorkspaceChannels(workspaceId, currentUserId));
    }

    @GetMapping("/workspace/{workspaceId}/hub")
    public ResponseEntity<ChatHubResponse> getWorkspaceChatHub(
            @PathVariable String workspaceId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getWorkspaceChatHub(workspaceId, currentUserId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ChannelResponse>> getProjectChannels(
            @PathVariable String projectId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getProjectChannels(projectId, currentUserId));
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelResponse> getChannel(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getChannelById(channelId, currentUserId));
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> createChannel(
            @Valid @RequestBody CreateChannelRequest request,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        ChannelResponse created = chatService.createChannel(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelResponse> updateChannel(
            @PathVariable String channelId,
            @RequestBody UpdateChannelRequest request,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.updateChannel(channelId, request, currentUserId));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Map<String, Object>> deleteChannel(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.deleteChannel(channelId, currentUserId);
        return ResponseEntity.ok(Map.of("success", true, "channelId", channelId));
    }

    @PostMapping("/{channelId}/reset-invite")
    public ResponseEntity<Map<String, String>> resetInviteCode(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        String newCode = chatService.resetInviteCode(channelId, currentUserId);
        return ResponseEntity.ok(Map.of("inviteCode", newCode));
    }

    @GetMapping("/{channelId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(@PathVariable String channelId) {
        return ResponseEntity.ok(chatService.getChannelMembers(channelId));
    }

    @GetMapping("/{channelId}/eligible-members")
    public ResponseEntity<List<EligibleMemberResponse>> getEligibleMembers(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getEligibleMembers(channelId, currentUserId));
    }

    @PostMapping("/{channelId}/members")
    public ResponseEntity<List<MemberResponse>> addMembers(
            @PathVariable String channelId,
            @Valid @RequestBody AddChannelMembersRequest request,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        List<MemberResponse> updated = chatService.addChannelMembers(channelId, request.getUserIds(), currentUserId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{channelId}/members/{targetUserId}/mute")
    public ResponseEntity<Map<String, Object>> setMemberMuted(
            @PathVariable String channelId,
            @PathVariable String targetUserId,
            @RequestParam boolean isMuted,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.setMemberMuted(channelId, targetUserId, isMuted, currentUserId);
        return ResponseEntity.ok(Map.of("success", true, "isMuted", isMuted));
    }

    @DeleteMapping("/{channelId}/members/{targetUserId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable String channelId,
            @PathVariable String targetUserId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.removeMember(channelId, targetUserId, currentUserId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{channelId}/join-requests")
    public ResponseEntity<List<JoinRequestResponse>> getJoinRequests(
            @PathVariable String channelId,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        return ResponseEntity.ok(chatService.getPendingJoinRequests(channelId, currentUserId));
    }

    @PostMapping("/join-requests/{requestId}/review")
    public ResponseEntity<Map<String, Object>> reviewJoinRequest(
            @PathVariable String requestId,
            @RequestParam boolean approve,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        chatService.reviewJoinRequest(requestId, approve, currentUserId);
        return ResponseEntity.ok(Map.of("success", true, "approved", approve));
    }

    @PostMapping("/join-by-code/{inviteCode}")
    public ResponseEntity<Map<String, Object>> joinByInviteCode(
            @PathVariable String inviteCode,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String currentUserId = requireCurrentUserId(authentication);
        String message = body != null ? body.get("message") : null;
        Map<String, Object> response = chatService.joinByInviteCode(inviteCode, message, currentUserId);
        return ResponseEntity.ok(response);
    }
}

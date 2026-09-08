package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.chat.*;
import com.taskosaur.taskosaur.enums.ChannelMemberRole;
import com.taskosaur.taskosaur.enums.ChannelType;
import com.taskosaur.taskosaur.enums.JoinRequestStatus;
import com.taskosaur.taskosaur.models.*;
import com.taskosaur.taskosaur.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChannelRepository channelRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final ChannelMessageRepository channelMessageRepository;
    private final ChannelJoinRequestRepository channelJoinRequestRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WebSocketEventService webSocketEventService;

    // ==========================================
    // CHANNELS
    // ==========================================

    @Transactional(readOnly = true)
    public List<ChannelResponse> getWorkspaceChannels(String workspaceId, String currentUserId) {
        List<Channel> channels = channelRepository.findAccessibleChannelsForUser(workspaceId, currentUserId);
        return channels.stream()
                .map(c -> toChannelResponse(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChannelResponse> getProjectChannels(String projectId, String currentUserId) {
        List<Channel> channels = channelRepository.findAccessibleProjectChannelsForUser(projectId, currentUserId);
        return channels.stream()
                .map(c -> toChannelResponse(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatHubResponse getWorkspaceChatHub(String workspaceId, String currentUserId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        List<ChannelResponse> workspaceChannels = getWorkspaceChannels(workspaceId, currentUserId);

        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        List<ProjectChatGroupResponse> projectGroups = new ArrayList<>();

        for (Project p : projects) {
            List<ChannelResponse> projectChannels = getProjectChannels(p.getId(), currentUserId);
            projectGroups.add(ProjectChatGroupResponse.builder()
                    .projectId(p.getId())
                    .projectName(p.getName())
                    .projectSlug(p.getSlug())
                    .channels(projectChannels)
                    .build());
        }

        return ChatHubResponse.builder()
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .workspaceChannels(workspaceChannels)
                .projectGroups(projectGroups)
                .build();
    }

    @Transactional(readOnly = true)
    public ChannelResponse getChannelById(String channelId, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found: " + channelId));
        return toChannelResponse(channel, currentUserId);
    }

    @Transactional
    public ChannelResponse createChannel(CreateChannelRequest request, String currentUserId) {
        String inviteCode = generateUniqueInviteCode();

        String workspaceId = request.getWorkspaceId();
        String projectId = request.getProjectId();

        if (projectId != null && !projectId.isBlank()) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
            if (workspaceId == null || workspaceId.isBlank()) {
                workspaceId = project.getWorkspaceId();
            }
        }

        Channel channel = Channel.builder()
                .workspaceId(workspaceId)
                .projectId(projectId != null && !projectId.isBlank() ? projectId : null)
                .name(request.getName().trim().toLowerCase().replaceAll("\\s+", "-"))
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : ChannelType.PUBLIC)
                .isAnnouncementOnly(Boolean.TRUE.equals(request.getIsAnnouncementOnly()))
                .requiresApproval(Boolean.TRUE.equals(request.getRequiresApproval()))
                .inviteCode(inviteCode)
                .createdById(currentUserId)
                .isArchived(false)
                .build();

        Channel saved = channelRepository.save(channel);

        // Creator automatically becomes ADMIN member
        ChannelMember adminMember = ChannelMember.builder()
                .channelId(saved.getId())
                .userId(currentUserId)
                .role(ChannelMemberRole.ADMIN)
                .isMuted(false)
                .lastReadAt(LocalDateTime.now())
                .build();
        channelMemberRepository.save(adminMember);

        return toChannelResponse(saved, currentUserId);
    }

    @Transactional
    public ChannelResponse updateChannel(String channelId, UpdateChannelRequest request, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        verifyChannelAdmin(channelId, currentUserId);

        if (request.getName() != null && !request.getName().isBlank()) {
            channel.setName(request.getName().trim().toLowerCase().replaceAll("\\s+", "-"));
        }
        if (request.getDescription() != null) {
            channel.setDescription(request.getDescription());
        }
        if (request.getIsAnnouncementOnly() != null) {
            channel.setIsAnnouncementOnly(request.getIsAnnouncementOnly());
        }
        if (request.getRequiresApproval() != null) {
            channel.setRequiresApproval(request.getRequiresApproval());
        }
        if (request.getIsArchived() != null) {
            channel.setIsArchived(request.getIsArchived());
        }

        Channel updated = channelRepository.save(channel);
        return toChannelResponse(updated, currentUserId);
    }

    @Transactional
    public String resetInviteCode(String channelId, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        verifyChannelAdmin(channelId, currentUserId);

        String newCode = generateUniqueInviteCode();
        channel.setInviteCode(newCode);
        channelRepository.save(channel);
        return newCode;
    }

    @Transactional
    public void deleteChannel(String channelId, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        verifyChannelAdmin(channelId, currentUserId);

        channelMessageRepository.deleteByChannelId(channelId);
        channelJoinRequestRepository.deleteByChannelId(channelId);
        channelMemberRepository.deleteByChannelId(channelId);
        channelRepository.delete(channel);
    }

    // ==========================================
    // MEMBERSHIP & JOIN WORKFLOW (QR / URL)
    // ==========================================

    @Transactional
    public Map<String, Object> joinByInviteCode(String inviteCode, String message, String currentUserId) {
        Channel channel = channelRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite code"));

        Map<String, Object> result = new HashMap<>();

        // Check if already a member
        Optional<ChannelMember> existingMember = channelMemberRepository.findByChannelIdAndUserId(channel.getId(), currentUserId);
        if (existingMember.isPresent()) {
            result.put("status", "ALREADY_MEMBER");
            result.put("channel", toChannelResponse(channel, currentUserId));
            return result;
        }

        // If approval is required, create join request
        if (Boolean.TRUE.equals(channel.getRequiresApproval())) {
            Optional<ChannelJoinRequest> existingRequest = channelJoinRequestRepository
                    .findByChannelIdAndUserIdAndStatus(channel.getId(), currentUserId, JoinRequestStatus.PENDING);

            if (existingRequest.isPresent()) {
                result.put("status", "REQUEST_ALREADY_PENDING");
                result.put("channel", toChannelResponse(channel, currentUserId));
                return result;
            }

            ChannelJoinRequest joinRequest = ChannelJoinRequest.builder()
                    .channelId(channel.getId())
                    .userId(currentUserId)
                    .status(JoinRequestStatus.PENDING)
                    .message(message)
                    .build();
            ChannelJoinRequest savedRequest = channelJoinRequestRepository.save(joinRequest);

            // Notify channel admins
            webSocketEventService.notifyJoinRequest(channel.getId(), toJoinRequestResponse(savedRequest));

            result.put("status", "REQUEST_SUBMITTED");
            result.put("channel", toChannelResponse(channel, currentUserId));
            return result;
        }

        // Direct join
        ChannelMember newMember = ChannelMember.builder()
                .channelId(channel.getId())
                .userId(currentUserId)
                .role(ChannelMemberRole.MEMBER)
                .isMuted(false)
                .lastReadAt(LocalDateTime.now())
                .build();
        channelMemberRepository.save(newMember);

        result.put("status", "JOINED_SUCCESSFULLY");
        result.put("channel", toChannelResponse(channel, currentUserId));
        return result;
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getPendingJoinRequests(String channelId, String currentUserId) {
        verifyChannelAdmin(channelId, currentUserId);
        return channelJoinRequestRepository.findByChannelIdAndStatusOrderByCreatedAtDesc(channelId, JoinRequestStatus.PENDING)
                .stream()
                .map(this::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void reviewJoinRequest(String requestId, boolean approve, String currentUserId) {
        ChannelJoinRequest request = channelJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        verifyChannelAdmin(request.getChannelId(), currentUserId);

        request.setStatus(approve ? JoinRequestStatus.APPROVED : JoinRequestStatus.REJECTED);
        request.setReviewedById(currentUserId);
        request.setReviewedAt(LocalDateTime.now());
        channelJoinRequestRepository.save(request);

        if (approve) {
            // Add as member if not already
            if (!channelMemberRepository.existsByChannelIdAndUserId(request.getChannelId(), request.getUserId())) {
                ChannelMember member = ChannelMember.builder()
                        .channelId(request.getChannelId())
                        .userId(request.getUserId())
                        .role(ChannelMemberRole.MEMBER)
                        .isMuted(false)
                        .lastReadAt(LocalDateTime.now())
                        .build();
                channelMemberRepository.save(member);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getChannelMembers(String channelId) {
        Channel channel = channelRepository.findById(channelId).orElse(null);
        List<ChannelMember> members = channelMemberRepository.findByChannelId(channelId);

        Set<String> allUserIds = new HashSet<>();
        for (ChannelMember m : members) {
            allUserIds.add(m.getUserId());
            if (m.getAddedById() != null) {
                allUserIds.add(m.getAddedById());
            }
        }

        Map<String, User> userMap = userRepository.findAllById(allUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return members.stream().map(m -> {
            User u = userMap.get(m.getUserId());

            String addedByName;
            ChannelMemberRole memberRole = m.getRole();
            if (channel != null && m.getUserId().equals(channel.getCreatedById())) {
                addedByName = "Người tạo kênh";
                memberRole = ChannelMemberRole.ADMIN;
            } else if (m.getAddedById() != null) {
                User inviter = userMap.get(m.getAddedById());
                addedByName = (inviter != null ? (inviter.getFirstName() + " " + inviter.getLastName()).trim() : "Thành viên nhóm");
            } else {
                addedByName = "Tham gia qua liên kết / mã QR";
            }

            return MemberResponse.builder()
                    .id(m.getId())
                    .channelId(m.getChannelId())
                    .userId(m.getUserId())
                    .name(u != null ? (u.getFirstName() + " " + u.getLastName()).trim() : "Unknown User")
                    .email(u != null ? u.getEmail() : "")
                    .avatar(u != null ? u.getAvatar() : null)
                    .role(memberRole)
                    .isMuted(m.getIsMuted())
                    .joinedAt(m.getJoinedAt())
                    .addedById(m.getAddedById())
                    .addedByName(addedByName)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EligibleMemberResponse> getEligibleMembers(String channelId, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, currentUserId)) {
            throw new IllegalArgumentException("Bạn phải là thành viên trong kênh mới có thể xem danh sách mời.");
        }

        Set<String> existingMemberUserIds = channelMemberRepository.findByChannelId(channelId).stream()
                .map(ChannelMember::getUserId)
                .collect(Collectors.toSet());

        Map<String, EligibleMemberResponse> eligibleMap = new LinkedHashMap<>();

        // 1. If channel belongs to a project, first add project members
        if (channel.getProjectId() != null) {
            List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(channel.getProjectId());
            List<String> projectUserIds = projectMembers.stream()
                    .map(ProjectMember::getUserId)
                    .filter(id -> !existingMemberUserIds.contains(id))
                    .collect(Collectors.toList());

            if (!projectUserIds.isEmpty()) {
                Map<String, User> projectUsers = userRepository.findAllById(projectUserIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

                for (ProjectMember pm : projectMembers) {
                    if (existingMemberUserIds.contains(pm.getUserId())) continue;
                    User u = projectUsers.get(pm.getUserId());
                    if (u != null) {
                        eligibleMap.put(u.getId(), EligibleMemberResponse.builder()
                                .id(u.getId())
                                .name((u.getFirstName() + " " + u.getLastName()).trim())
                                .email(u.getEmail())
                                .avatar(u.getAvatar())
                                .role(pm.getRole() != null ? pm.getRole().name() : "MEMBER")
                                .source("PROJECT")
                                .build());
                    }
                }
            }
        }

        // 2. Add workspace members
        List<WorkspaceMember> workspaceMembers = workspaceMemberRepository.findByWorkspaceId(channel.getWorkspaceId());
        List<String> wsUserIds = workspaceMembers.stream()
                .map(WorkspaceMember::getUserId)
                .filter(id -> !existingMemberUserIds.contains(id) && !eligibleMap.containsKey(id))
                .collect(Collectors.toList());

        if (!wsUserIds.isEmpty()) {
            Map<String, User> wsUsers = userRepository.findAllById(wsUserIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));

            for (WorkspaceMember wm : workspaceMembers) {
                if (existingMemberUserIds.contains(wm.getUserId()) || eligibleMap.containsKey(wm.getUserId())) continue;
                User u = wsUsers.get(wm.getUserId());
                if (u != null) {
                    eligibleMap.put(u.getId(), EligibleMemberResponse.builder()
                            .id(u.getId())
                            .name((u.getFirstName() + " " + u.getLastName()).trim())
                            .email(u.getEmail())
                            .avatar(u.getAvatar())
                            .role(wm.getRole() != null ? wm.getRole().name() : "MEMBER")
                            .source("WORKSPACE")
                            .build());
                }
            }
        }

        return new ArrayList<>(eligibleMap.values());
    }

    @Transactional
    public List<MemberResponse> addChannelMembers(String channelId, List<String> userIds, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found: " + channelId));

        // Anyone who is already a member can invite
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, currentUserId)) {
            throw new IllegalArgumentException("Bạn phải là thành viên của kênh để mời người khác vào nhóm.");
        }

        User inviter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Inviter not found"));
        String inviterName = (inviter.getFirstName() + " " + inviter.getLastName()).trim();

        List<String> addedUserNames = new ArrayList<>();

        for (String targetUserId : userIds) {
            if (targetUserId == null || targetUserId.isBlank()) continue;

            // Check if already a member
            if (channelMemberRepository.existsByChannelIdAndUserId(channelId, targetUserId)) {
                continue;
            }

            // Check if targetUser is in workspace or project
            boolean inWorkspace = workspaceMemberRepository.existsByWorkspaceIdAndUserId(channel.getWorkspaceId(), targetUserId);
            boolean inProject = channel.getProjectId() != null && projectMemberRepository.existsByProjectIdAndUserId(channel.getProjectId(), targetUserId);

            if (!inWorkspace && !inProject) {
                log.warn("User {} is neither in workspace {} nor project {}", targetUserId, channel.getWorkspaceId(), channel.getProjectId());
                throw new IllegalArgumentException("Người dùng được mời phải thuộc Không gian làm việc hoặc Dự án của kênh này.");
            }

            // Create ChannelMember with addedById = currentUserId
            ChannelMember member = ChannelMember.builder()
                    .channelId(channelId)
                    .userId(targetUserId)
                    .role(ChannelMemberRole.MEMBER)
                    .isMuted(false)
                    .addedById(currentUserId)
                    .lastReadAt(LocalDateTime.now())
                    .build();
            channelMemberRepository.save(member);

            User targetUser = userRepository.findById(targetUserId).orElse(null);
            if (targetUser != null) {
                addedUserNames.add((targetUser.getFirstName() + " " + targetUser.getLastName()).trim());
            }
        }

        // Post a system message in the channel if members were added
        if (!addedUserNames.isEmpty()) {
            String systemMsgContent = inviterName + " đã thêm " + String.join(", ", addedUserNames) + " vào kênh.";
            ChannelMessage systemMsg = ChannelMessage.builder()
                    .channelId(channelId)
                    .senderId(currentUserId)
                    .content(systemMsgContent)
                    .isEdited(false)
                    .isDeleted(false)
                    .build();
            channelMessageRepository.save(systemMsg);

            webSocketEventService.notifyChatMessage(channelId, toMessageResponse(systemMsg, inviter));
            webSocketEventService.notifyMemberAdded(channelId, Map.of(
                    "channelId", channelId,
                    "addedBy", inviterName,
                    "addedUserNames", addedUserNames
            ));
        }

        return getChannelMembers(channelId);
    }

    // ==========================================
    // MESSAGING & FILE SHARING
    // ==========================================

    @Transactional(readOnly = true)
    public List<MessageResponse> getChannelMessages(String channelId, String currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        List<ChannelMessage> messages = channelMessageRepository.findByChannelIdOrderByCreatedAtAsc(channelId, pageable).getContent();

        List<String> senderIds = messages.stream().map(ChannelMessage::getSenderId).distinct().collect(Collectors.toList());
        Map<String, User> userMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return messages.stream()
                .map(m -> toMessageResponse(m, userMap.get(m.getSenderId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(String channelId, SendMessageRequest request, String currentUserId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Channel not found"));

        Optional<ChannelMember> memberOpt = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUserId);

        // Auto-join public channels when sending first message
        ChannelMember member;
        if (memberOpt.isEmpty()) {
            if (channel.getType() == ChannelType.PUBLIC || channel.getType() == ChannelType.ANNOUNCEMENT) {
                member = ChannelMember.builder()
                        .channelId(channelId)
                        .userId(currentUserId)
                        .role(ChannelMemberRole.MEMBER)
                        .isMuted(false)
                        .lastReadAt(LocalDateTime.now())
                        .build();
                member = channelMemberRepository.save(member);
            } else {
                throw new IllegalStateException("You are not a member of this private channel");
            }
        } else {
            member = memberOpt.get();
        }

        // 1. ADMIN-ONLY / ANNOUNCEMENT CHECK
        if (Boolean.TRUE.equals(channel.getIsAnnouncementOnly())) {
            if (member.getRole() != ChannelMemberRole.ADMIN) {
                throw new IllegalStateException("Only channel administrators can send messages in this announcement channel");
            }
        }

        // 2. MUTED / RESTRICTION CHECK
        if (Boolean.TRUE.equals(member.getIsMuted())) {
            throw new IllegalStateException("You have been restricted from sending messages in this channel");
        }

        // 3. BLOCK CHECK (if Direct Message)
        if (channel.getType() == ChannelType.DIRECT_MESSAGE) {
            List<ChannelMember> allMembers = channelMemberRepository.findByChannelId(channelId);
            for (ChannelMember other : allMembers) {
                if (!other.getUserId().equals(currentUserId)) {
                    if (userBlockRepository.isBlockExistsBetween(currentUserId, other.getUserId())) {
                        throw new IllegalStateException("Cannot send message: a user block is active in this conversation");
                    }
                }
            }
        }

        ChannelMessage message = ChannelMessage.builder()
                .channelId(channelId)
                .senderId(currentUserId)
                .content(request.getContent() != null ? request.getContent().trim() : "")
                .attachments(request.getAttachments())
                .replyToId(request.getReplyToId())
                .isEdited(false)
                .isDeleted(false)
                .build();

        ChannelMessage saved = channelMessageRepository.save(message);

        // Update sender lastReadAt
        member.setLastReadAt(LocalDateTime.now());
        channelMemberRepository.save(member);

        User sender = userRepository.findById(currentUserId).orElse(null);
        MessageResponse response = toMessageResponse(saved, sender);

        // Realtime broadcast via WebSocket STOMP
        webSocketEventService.notifyChatMessage(channelId, response);

        return response;
    }

    @Transactional
    public void deleteMessage(String channelId, String messageId, String currentUserId) {
        ChannelMessage message = channelMessageRepository.findByIdAndChannelId(messageId, channelId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        // Only sender or channel admin can delete
        boolean isSender = message.getSenderId().equals(currentUserId);
        boolean isAdmin = channelMemberRepository.findByChannelIdAndUserId(channelId, currentUserId)
                .map(m -> m.getRole() == ChannelMemberRole.ADMIN)
                .orElse(false);

        if (!isSender && !isAdmin) {
            throw new IllegalStateException("You do not have permission to delete this message");
        }

        message.setIsDeleted(true);
        message.setContent("Tin nhắn đã được thu hồi");
        message.setDeletedById(currentUserId);
        channelMessageRepository.save(message);

        // Realtime broadcast deletion
        webSocketEventService.notifyMessageDeleted(channelId, messageId);
    }

    @Transactional
    public void markAsRead(String channelId, String currentUserId) {
        channelMemberRepository.findByChannelIdAndUserId(channelId, currentUserId)
                .ifPresent(m -> {
                    m.setLastReadAt(LocalDateTime.now());
                    channelMemberRepository.save(m);
                });
    }

    // ==========================================
    // MODERATION: MUTE & BLOCK
    // ==========================================

    @Transactional
    public void setMemberMuted(String channelId, String targetUserId, boolean isMuted, String currentUserId) {
        verifyChannelAdmin(channelId, currentUserId);

        ChannelMember targetMember = channelMemberRepository.findByChannelIdAndUserId(channelId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in channel"));

        targetMember.setIsMuted(isMuted);
        channelMemberRepository.save(targetMember);

        webSocketEventService.notifyMemberMuted(channelId, targetUserId, isMuted);
    }

    @Transactional
    public void removeMember(String channelId, String targetUserId, String currentUserId) {
        verifyChannelAdmin(channelId, currentUserId);
        channelMemberRepository.deleteByChannelIdAndUserId(channelId, targetUserId);
    }

    @Transactional
    public void blockUser(BlockUserRequest request, String currentUserId) {
        if (request.getBlockedId().equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot block yourself");
        }

        if (userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, request.getBlockedId())) {
            return; // Already blocked
        }

        UserBlock block = UserBlock.builder()
                .blockerId(currentUserId)
                .blockedId(request.getBlockedId())
                .reason(request.getReason())
                .build();
        userBlockRepository.save(block);
    }

    @Transactional
    public void unblockUser(String blockedId, String currentUserId) {
        userBlockRepository.deleteByBlockerIdAndBlockedId(currentUserId, blockedId);
    }

    @Transactional(readOnly = true)
    public List<UserBlockResponse> getBlockedUsers(String currentUserId) {
        List<UserBlock> blocks = userBlockRepository.findByBlockerId(currentUserId);
        List<String> blockedIds = blocks.stream().map(UserBlock::getBlockedId).collect(Collectors.toList());
        Map<String, User> userMap = userRepository.findAllById(blockedIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return blocks.stream().map(b -> {
            User u = userMap.get(b.getBlockedId());
            return UserBlockResponse.builder()
                    .id(b.getId())
                    .blockedId(b.getBlockedId())
                    .blockedName(u != null ? (u.getFirstName() + " " + u.getLastName()).trim() : "Unknown User")
                    .blockedEmail(u != null ? u.getEmail() : "")
                    .blockedAvatar(u != null ? u.getAvatar() : null)
                    .reason(b.getReason())
                    .createdAt(b.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    // ==========================================
    // HELPERS & CONVERTERS
    // ==========================================

    private void verifyChannelAdmin(String channelId, String userId) {
        Channel channel = channelRepository.findById(channelId).orElse(null);
        if (channel != null && userId.equals(channel.getCreatedById())) {
            return;
        }
        ChannelMember member = channelMemberRepository.findByChannelIdAndUserId(channelId, userId)
                .orElseThrow(() -> new IllegalStateException("You are not a member of this channel"));
        if (member.getRole() != ChannelMemberRole.ADMIN) {
            throw new IllegalStateException("Only channel administrators can perform this action");
        }
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        } while (channelRepository.existsByInviteCode(code));
        return code;
    }

    private ChannelResponse toChannelResponse(Channel c, String currentUserId) {
        long memberCount = channelMemberRepository.countByChannelId(c.getId());
        Optional<ChannelMember> memberOpt = channelMemberRepository.findByChannelIdAndUserId(c.getId(), currentUserId);

        long unreadCount = 0;
        if (memberOpt.isPresent()) {
            LocalDateTime lastRead = memberOpt.get().getLastReadAt();
            unreadCount = channelMessageRepository.countUnreadMessages(c.getId(), lastRead);
        }

        MessageResponse lastMessage = channelMessageRepository.findLatestMessageInChannel(c.getId())
                .map(m -> {
                    User sender = userRepository.findById(m.getSenderId()).orElse(null);
                    return toMessageResponse(m, sender);
                }).orElse(null);

        ChannelMemberRole userRole = memberOpt.map(ChannelMember::getRole).orElse(null);
        boolean isCreator = c.getCreatedById() != null && c.getCreatedById().equals(currentUserId);
        if (isCreator) {
            userRole = ChannelMemberRole.ADMIN;
        }

        String projectName = null;
        if (c.getProjectId() != null) {
            projectName = projectRepository.findById(c.getProjectId())
                    .map(Project::getName)
                    .orElse(null);
        }

        return ChannelResponse.builder()
                .id(c.getId())
                .workspaceId(c.getWorkspaceId())
                .projectId(c.getProjectId())
                .projectName(projectName)
                .name(c.getName())
                .description(c.getDescription())
                .type(c.getType())
                .isAnnouncementOnly(c.getIsAnnouncementOnly())
                .requiresApproval(c.getRequiresApproval())
                .inviteCode(c.getInviteCode())
                .isArchived(c.getIsArchived())
                .createdById(c.getCreatedById())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .memberCount(memberCount)
                .unreadCount(unreadCount)
                .isMember(memberOpt.isPresent() || isCreator)
                .role(userRole)
                .isMuted(memberOpt.map(ChannelMember::getIsMuted).orElse(false))
                .lastMessage(lastMessage)
                .build();
    }

    private MessageResponse toMessageResponse(ChannelMessage m, User sender) {
        return MessageResponse.builder()
                .id(m.getId())
                .channelId(m.getChannelId())
                .senderId(m.getSenderId())
                .senderName(sender != null ? (sender.getFirstName() + " " + sender.getLastName()).trim() : "Unknown User")
                .senderAvatar(sender != null ? sender.getAvatar() : null)
                .senderEmail(sender != null ? sender.getEmail() : null)
                .content(Boolean.TRUE.equals(m.getIsDeleted()) ? "Tin nhắn đã được thu hồi" : m.getContent())
                .attachments(Boolean.TRUE.equals(m.getIsDeleted()) ? null : m.getAttachments())
                .replyToId(m.getReplyToId())
                .isEdited(m.getIsEdited())
                .isDeleted(m.getIsDeleted())
                .deletedById(m.getDeletedById())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private JoinRequestResponse toJoinRequestResponse(ChannelJoinRequest req) {
        User user = userRepository.findById(req.getUserId()).orElse(null);
        Channel channel = channelRepository.findById(req.getChannelId()).orElse(null);

        return JoinRequestResponse.builder()
                .id(req.getId())
                .channelId(req.getChannelId())
                .channelName(channel != null ? channel.getName() : "")
                .userId(req.getUserId())
                .userName(user != null ? (user.getFirstName() + " " + user.getLastName()).trim() : "Unknown User")
                .userEmail(user != null ? user.getEmail() : "")
                .userAvatar(user != null ? user.getAvatar() : null)
                .status(req.getStatus())
                .message(req.getMessage())
                .reviewedById(req.getReviewedById())
                .reviewedAt(req.getReviewedAt())
                .createdAt(req.getCreatedAt())
                .build();
    }
}

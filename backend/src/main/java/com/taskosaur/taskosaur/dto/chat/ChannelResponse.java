package com.taskosaur.taskosaur.dto.chat;

import com.taskosaur.taskosaur.enums.ChannelMemberRole;
import com.taskosaur.taskosaur.enums.ChannelType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChannelResponse {

    private String id;
    private String workspaceId;
    private String projectId;
    private String projectName;
    private String name;
    private String description;
    private ChannelType type;
    private Boolean isAnnouncementOnly;
    private Boolean requiresApproval;
    private String inviteCode;
    private Boolean isArchived;
    private String createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private long memberCount;
    private long unreadCount;
    private Boolean isMember;
    private ChannelMemberRole role;
    private Boolean isMuted;
    private MessageResponse lastMessage;
}

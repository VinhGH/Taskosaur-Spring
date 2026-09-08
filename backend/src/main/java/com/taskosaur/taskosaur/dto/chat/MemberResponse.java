package com.taskosaur.taskosaur.dto.chat;

import com.taskosaur.taskosaur.enums.ChannelMemberRole;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponse {

    private String id;
    private String channelId;
    private String userId;
    private String name;
    private String email;
    private String avatar;
    private ChannelMemberRole role;
    private Boolean isMuted;
    private LocalDateTime joinedAt;
    private String addedById;
    private String addedByName;
}

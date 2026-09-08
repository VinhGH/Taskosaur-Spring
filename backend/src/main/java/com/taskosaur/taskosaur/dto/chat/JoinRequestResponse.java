package com.taskosaur.taskosaur.dto.chat;

import com.taskosaur.taskosaur.enums.JoinRequestStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinRequestResponse {

    private String id;
    private String channelId;
    private String channelName;
    private String userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private JoinRequestStatus status;
    private String message;
    private String reviewedById;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}

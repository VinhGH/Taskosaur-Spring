package com.taskosaur.taskosaur.dto.chat;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlockResponse {

    private String id;
    private String blockedId;
    private String blockedName;
    private String blockedEmail;
    private String blockedAvatar;
    private String reason;
    private LocalDateTime createdAt;
}

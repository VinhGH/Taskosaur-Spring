package com.taskosaur.taskosaur.dto.chat;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private String id;
    private String channelId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String senderEmail;
    private String content;
    private String attachments;
    private String replyToId;
    private Boolean isEdited;
    private Boolean isDeleted;
    private String deletedById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

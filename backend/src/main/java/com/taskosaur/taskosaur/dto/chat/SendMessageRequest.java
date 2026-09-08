package com.taskosaur.taskosaur.dto.chat;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    private String content;
    private String attachments;
    private String replyToId;
}

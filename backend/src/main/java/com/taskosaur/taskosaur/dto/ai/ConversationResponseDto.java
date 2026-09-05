package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponseDto {
    private String id;
    private String title;
    private String sessionId;
    private String userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChatMessageDto> messages;
}

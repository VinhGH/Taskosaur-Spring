package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDto {
    @NotBlank(message = "Message must not be blank")
    private String message;

    private List<ChatMessageDto> history;
    private String workspaceId;
    private String projectId;
    private String sessionId;
    private String currentOrganizationId;
}

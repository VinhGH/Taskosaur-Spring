package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDto {
    private String message;
    private boolean success;
    private String error;

    public static ChatResponseDto ofSuccess(String message) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .build();
    }

    public static ChatResponseDto ofError(String error) {
        return ChatResponseDto.builder()
                .message("")
                .success(false)
                .error(error)
                .build();
    }
}

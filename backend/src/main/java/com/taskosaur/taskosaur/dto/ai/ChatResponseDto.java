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
    private java.util.List<java.util.Map<String, Object>> actions;

    public static ChatResponseDto ofSuccess(String message) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .actions(java.util.List.of())
                .build();
    }

    public static ChatResponseDto ofSuccess(String message, java.util.List<java.util.Map<String, Object>> actions) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .actions(actions != null ? actions : java.util.List.of())
                .build();
    }

    public static ChatResponseDto ofError(String error) {
        return ChatResponseDto.builder()
                .message("")
                .success(false)
                .error(error)
                .actions(java.util.List.of())
                .build();
    }
}

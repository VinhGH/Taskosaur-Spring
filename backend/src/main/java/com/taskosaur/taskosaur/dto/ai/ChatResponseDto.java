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
    private java.util.List<String> logs;
    private java.util.List<java.util.Map<String, String>> steps;

    public static ChatResponseDto ofSuccess(String message) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .actions(java.util.List.of())
                .logs(java.util.List.of())
                .steps(java.util.List.of())
                .build();
    }

    public static ChatResponseDto ofSuccess(String message, java.util.List<java.util.Map<String, Object>> actions) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .actions(actions != null ? actions : java.util.List.of())
                .logs(java.util.List.of())
                .steps(java.util.List.of())
                .build();
    }

    public static ChatResponseDto ofSuccess(String message, java.util.List<java.util.Map<String, Object>> actions, java.util.List<String> logs, java.util.List<java.util.Map<String, String>> steps) {
        return ChatResponseDto.builder()
                .message(message)
                .success(true)
                .actions(actions != null ? actions : java.util.List.of())
                .logs(logs != null ? logs : java.util.List.of())
                .steps(steps != null ? steps : java.util.List.of())
                .build();
    }

    public static ChatResponseDto ofError(String error) {
        return ChatResponseDto.builder()
                .message("")
                .success(false)
                .error(error)
                .actions(java.util.List.of())
                .logs(java.util.List.of())
                .steps(java.util.List.of())
                .build();
    }
}

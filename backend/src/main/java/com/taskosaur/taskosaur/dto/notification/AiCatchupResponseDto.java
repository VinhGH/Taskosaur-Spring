package com.taskosaur.taskosaur.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCatchupResponseDto {
    private boolean success;
    private int unreadCount;
    private int urgentCount;
    private String summary;
    private List<String> highlights;
    private List<SuggestedActionDto> suggestedActions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedActionDto {
        private String id;
        private String label;
        private String actionType; // e.g. "VIEW_TASK", "ACCEPT_INVITE", "MARK_ALL_READ", "VIEW_DISCUSSIONS"
        private String targetUrl;
        private String entityId;
        private String entityType;
    }
}

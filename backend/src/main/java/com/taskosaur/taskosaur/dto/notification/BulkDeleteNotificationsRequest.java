package com.taskosaur.taskosaur.dto.notification;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDeleteNotificationsRequest {
    private List<String> ids;
    private List<String> notificationIds;

    public List<String> getResolvedIds() {
        if (ids != null && !ids.isEmpty()) {
            return ids;
        }
        if (notificationIds != null && !notificationIds.isEmpty()) {
            return notificationIds;
        }
        return List.of();
    }
}

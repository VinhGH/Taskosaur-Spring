package com.taskosaur.taskosaur.dto.notification;

import com.taskosaur.taskosaur.enums.NotificationPriority;
import com.taskosaur.taskosaur.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationParams {
    private NotificationType type;
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.MEDIUM;
    private String title;
    private String message;
    private String entityType;
    private String entityId;
    private String actionUrl;
    private String userId;
    private String organizationId;
    private String creatorId;
}

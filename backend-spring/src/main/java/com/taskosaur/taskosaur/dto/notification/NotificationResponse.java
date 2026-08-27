package com.taskosaur.taskosaur.dto.notification;

import com.taskosaur.taskosaur.enums.NotificationPriority;
import com.taskosaur.taskosaur.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationPriority priority;
    private Boolean isRead;
    private String entityType;
    private String entityId;
    private String actionUrl;
    private String userId;
    private String organizationId;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}

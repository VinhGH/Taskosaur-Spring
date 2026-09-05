package com.taskosaur.taskosaur.models;

import com.taskosaur.taskosaur.enums.NotificationPriority;
import com.taskosaur.taskosaur.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.MEDIUM;

    @Column(name = "\"isRead\"")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "organization_id")
    private String organizationId;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_by_id")
    private String createdBy;

    @Column(name = "updated_by_id")
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

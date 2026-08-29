package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.notification.CreateNotificationParams;
import com.taskosaur.taskosaur.dto.notification.NotificationResponse;
import com.taskosaur.taskosaur.enums.NotificationPriority;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.Notification;
import com.taskosaur.taskosaur.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(CreateNotificationParams params) {
        Notification notification = Notification.builder()
                .type(params.getType())
                .priority(params.getPriority() != null ? params.getPriority() : NotificationPriority.MEDIUM)
                .title(params.getTitle())
                .message(params.getMessage())
                .entityType(params.getEntityType())
                .entityId(params.getEntityId())
                .actionUrl(params.getActionUrl())
                .userId(params.getUserId())
                .organizationId(params.getOrganizationId())
                .isRead(false)
                .createdBy(params.getCreatorId())
                .build();
        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public List<NotificationResponse> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot mark another user's notification as read");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now(ZoneOffset.UTC));
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    public NotificationResponse getNotificationById(String id, String userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (userId != null && !n.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot view another user's notification");
        }
        return buildResponse(n);
    }

    public void deleteNotification(String id, String userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (userId != null && !n.getUserId().equals(userId)) {
            throw new UnauthorizedException("Cannot delete another user's notification");
        }
        notificationRepository.delete(n);
    }

    public void bulkDeleteNotifications(List<String> ids, String userId) {
        if (ids == null || ids.isEmpty()) return;
        for (String id : ids) {
            notificationRepository.findById(id).ifPresent(n -> {
                if (userId == null || n.getUserId().equals(userId)) {
                    notificationRepository.delete(n);
                }
            });
        }
    }

    private NotificationResponse buildResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .priority(n.getPriority())
                .isRead(n.getIsRead())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .actionUrl(n.getActionUrl())
                .userId(n.getUserId())
                .organizationId(n.getOrganizationId())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

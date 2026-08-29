package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.notification.NotificationResponse;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        String userId = getUserId(authentication);
        List<NotificationResponse> list = notificationService.getUserNotifications(userId);
        long unread = notificationService.getUnreadCount(userId);
        int total = list.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / limit));

        Map<String, Object> pagination = Map.of(
                "currentPage", page,
                "totalPages", totalPages,
                "totalCount", total,
                "hasNextPage", page < totalPages,
                "hasPrevPage", page > 1
        );

        Map<String, Object> summary = Map.of(
                "total", total,
                "unread", unread,
                "byType", Map.of(),
                "byPriority", Map.of()
        );

        return ResponseEntity.ok(Map.of(
                "notifications", list,
                "pagination", pagination,
                "summary", summary,
                "total", total,
                "page", page,
                "totalPages", totalPages,
                "unreadCount", unread
        ));
    }

    @GetMapping("/unread-by-organization")
    public ResponseEntity<List<Object>> getUnreadByOrganization(Authentication authentication) {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/user/{userId}/organization/{organizationId}")
    public ResponseEntity<Map<String, Object>> getUserOrgNotifications(
            @PathVariable String userId,
            @PathVariable String organizationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        List<NotificationResponse> list = notificationService.getUserNotifications(userId);
        long unread = notificationService.getUnreadCount(userId);
        int total = list.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / limit));

        Map<String, Object> pagination = Map.of(
                "currentPage", page,
                "totalPages", totalPages,
                "totalCount", total,
                "hasNextPage", page < totalPages,
                "hasPrevPage", page > 1
        );

        Map<String, Object> summary = Map.of(
                "total", total,
                "unread", unread,
                "byType", Map.of(),
                "byPriority", Map.of()
        );

        return ResponseEntity.ok(Map.of(
                "notifications", list,
                "pagination", pagination,
                "summary", summary,
                "total", total,
                "page", page,
                "totalPages", totalPages,
                "unreadCount", unread
        ));
    }

    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> getRecentNotifications(Authentication authentication) {
        String userId = getUserId(authentication);
        List<NotificationResponse> list = notificationService.getUserNotifications(userId);
        long unread = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of(
                "notifications", list,
                "total", list.size(),
                "unreadCount", unread
        ));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(Authentication authentication) {
        String userId = getUserId(authentication);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(Authentication authentication) {
        String userId = getUserId(authentication);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count, "unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping({"/mark-all-read", "/read-all"})
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        String userId = getUserId(authentication);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(@PathVariable String id, Authentication authentication) {
        String userId = getUserId(authentication);
        return ResponseEntity.ok(notificationService.getNotificationById(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable String id, Authentication authentication) {
        String userId = getUserId(authentication);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification deleted successfully"));
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkDelete(
            @RequestBody(required = false) com.taskosaur.taskosaur.dto.notification.BulkDeleteNotificationsRequest request,
            Authentication authentication
    ) {
        String userId = getUserId(authentication);
        List<String> ids = request != null ? request.getIds() : List.of();
        notificationService.bulkDeleteNotifications(ids, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notifications deleted successfully"));
    }

    private String getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "";
        }
        return authentication.getName();
    }
}

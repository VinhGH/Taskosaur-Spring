package com.taskosaur.taskosaur.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    // Map: userId -> Set of active WebSocket session IDs
    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    // Map: sessionId -> userId
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();

    public void registerSession(String sessionId, String userId) {
        if (sessionId == null || userId == null || userId.isBlank()) return;

        sessionToUser.put(sessionId, userId);
        Set<String> sessions = userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        boolean wasOffline = sessions.isEmpty();
        sessions.add(sessionId);

        log.info("User {} connected session {}. Total active sessions: {}", userId, sessionId, sessions.size());

        if (wasOffline) {
            broadcastPresenceChange(userId, true);
        }
    }

    public void removeSession(String sessionId) {
        if (sessionId == null) return;

        String userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            Set<String> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(sessionId);
                log.info("User {} disconnected session {}. Remaining sessions: {}", userId, sessionId, sessions.size());
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                    broadcastPresenceChange(userId, false);
                }
            }
        }
    }

    public boolean isUserOnline(String userId) {
        if (userId == null) return false;
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public Set<String> getOnlineUserIds() {
        return Collections.unmodifiableSet(userSessions.keySet());
    }

    private void broadcastPresenceChange(String userId, boolean isOnline) {
        String event = isOnline ? "user:online" : "user:offline";
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("isOnline", isOnline);
        data.put("timestamp", Instant.now().toString());

        Map<String, Object> message = new HashMap<>();
        message.put("event", event);
        message.put("data", data);
        message.put("timestamp", Instant.now().toString());

        messagingTemplate.convertAndSend("/topic/presence", (Object) message);
        log.info("Broadcasted presence [{}]: userId={}, isOnline={}", event, userId, isOnline);
    }
}

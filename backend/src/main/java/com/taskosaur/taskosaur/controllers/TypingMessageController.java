package com.taskosaur.taskosaur.controllers;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TypingMessageController {

    private final SimpMessagingTemplate messagingTemplate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypingPayload {
        private String userId;
        private String userName;
        private Boolean isTyping;
    }

    @MessageMapping("/task/{taskId}/typing")
    public void handleTaskTyping(@DestinationVariable String taskId, @Payload TypingPayload payload) {
        log.debug("Received typing event for task {}: user={}, isTyping={}",
                taskId, payload.getUserName(), payload.getIsTyping());

        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("userId", payload.getUserId());
        data.put("userName", payload.getUserName());
        data.put("isTyping", payload.getIsTyping() != null && payload.getIsTyping());
        data.put("timestamp", Instant.now().toString());

        Map<String, Object> message = new HashMap<>();
        message.put("event", payload.getIsTyping() != null && payload.getIsTyping() ? "user:typing" : "user:stopped_typing");
        message.put("data", data);
        message.put("timestamp", Instant.now().toString());

        messagingTemplate.convertAndSend("/topic/task/" + taskId + "/typing", (Object) message);
        // Also send to /topic/task/{taskId} for clients subscribed to whole task
        messagingTemplate.convertAndSend("/topic/task/" + taskId, (Object) message);
    }
}

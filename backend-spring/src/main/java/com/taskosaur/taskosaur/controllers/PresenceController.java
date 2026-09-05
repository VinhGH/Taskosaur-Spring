package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.services.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/online")
    public ResponseEntity<Map<String, Object>> getOnlineUsers() {
        Set<String> onlineUserIds = presenceService.getOnlineUserIds();
        return ResponseEntity.ok(Map.of(
                "onlineUserIds", onlineUserIds,
                "count", onlineUserIds.size()
        ));
    }
}

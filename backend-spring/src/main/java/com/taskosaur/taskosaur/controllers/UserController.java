package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.user.UpdateUserRequest;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.services.AuthService;
import com.taskosaur.taskosaur.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserService userService;

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Object>> checkUsersExist() {
        boolean exists = authService.checkUsersExist();
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/status/bulk")
    public ResponseEntity<Map<String, Object>> getBulkStatus(@RequestParam(required = false) String userIds) {
        Map<String, Object> statusMap = new HashMap<>();
        if (userIds != null && !userIds.isBlank()) {
            for (String id : userIds.split(",")) {
                String cleanId = id.trim();
                if (!cleanId.isEmpty()) {
                    statusMap.put(cleanId, Map.of("isOnline", true));
                }
            }
        }
        return ResponseEntity.ok(Map.of("status", statusMap));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> getUserStatus(@PathVariable String id) {
        User u = userService.findById(id);
        return ResponseEntity.ok(Map.of(
                "userId", u.getId(),
                "isOnline", true,
                "status", u.getStatus() != null ? u.getStatus().name() : "ACTIVE"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<User> updateUser(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateUserRequest req
    ) {
        String currentUserId = authentication != null ? authentication.getName() : id;
        User updated = userService.update(id, req, currentUserId);
        return ResponseEntity.ok(updated);
    }
}

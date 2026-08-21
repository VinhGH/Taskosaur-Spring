package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class UserController {
    private final AuthService authService;

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Object>> checkUsersExist() {
        boolean exists = authService.checkUsersExist();
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}

package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @GetMapping("/setup/required")
    public ResponseEntity<Map<String, Object>> isSetupRequired() {
        return ResponseEntity.ok(authService.isSetupRequired());
    }
    @PostMapping("/setup")
    public ResponseEntity<AuthResponse> setupSuperAdmin(@Valid @RequestBody SetupAdminRequest request) {
        AuthResponse response = authService.setupSuperAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

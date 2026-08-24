package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.LoginRequest;
import com.taskosaur.taskosaur.dto.auth.RegisterRequest;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.models.Workspace;
import com.taskosaur.taskosaur.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication){
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        String userId = authentication.getName();
        User user = authService.getProfile(userId);
        return ResponseEntity.ok(user);
    }
    @GetMapping("/registration-status")
    public ResponseEntity<Map<String, Object>>getRegistrationStatus() {
        return ResponseEntity.ok(Map.of("enabled", true));
    }
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

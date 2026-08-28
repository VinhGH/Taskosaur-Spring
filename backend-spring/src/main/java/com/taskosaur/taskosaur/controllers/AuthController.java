package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.LoginRequest;
import com.taskosaur.taskosaur.dto.auth.RegisterRequest;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
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

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody(required = false) com.taskosaur.taskosaur.dto.auth.RefreshTokenRequest request) {
        String token = request != null ? request.getRefreshToken() : null;
        AuthResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        String userId = authentication.getName();
        User user = authService.getProfile(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/registration-status")
    public ResponseEntity<Map<String, Object>> getRegistrationStatus() {
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/access-control")
    public ResponseEntity<Map<String, Object>> getAccessControl(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "organization") String scope,
            @RequestParam(required = false, defaultValue = "") String id
    ) {
        String userId = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(Map.of(
                "isElevated", true,
                "role", "SUPER_ADMIN",
                "canChange", true,
                "userId", userId,
                "scopeId", id,
                "scopeType", scope != null ? scope.toUpperCase() : "ORGANIZATION",
                "isSuperAdmin", true
        ));
    }
}

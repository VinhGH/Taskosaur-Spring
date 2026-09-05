package com.taskosaur.taskosaur.controllers;

import com.taskosaur.taskosaur.dto.auth.*;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.services.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3001", allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken != null ? refreshToken : "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(refreshToken != null ? Duration.ofDays(30) : Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @GetMapping("/setup/required")
    public ResponseEntity<Map<String, Object>> isSetupRequired() {
        return ResponseEntity.ok(authService.isSetupRequired());
    }

    @PostMapping("/setup")
    public ResponseEntity<AuthResponse> setupSuperAdmin(
            @Valid @RequestBody SetupAdminRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.setupSuperAdmin(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    @com.taskosaur.taskosaur.annotations.RateLimit(limit = 5, period = 60, keyPrefix = "auth_login", strategy = com.taskosaur.taskosaur.enums.RateLimitStrategy.BY_IP)
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            Authentication authentication,
            HttpServletResponse response
    ) {
        String userId = authentication != null ? authentication.getName() : null;
        authService.logout(userId);
        setRefreshTokenCookie(response, null);
        return ResponseEntity.ok(Map.of("message", "Logout successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken,
            HttpServletResponse response
    ) {
        String token = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : (request != null ? request.getRefreshToken() : null);

        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("Refresh token is required");
        }

        AuthResponse authResponse = authService.refreshToken(token);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping({"/profile", "/me"})
    public ResponseEntity<User> getProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Unauthorized");
        }
        String userId = authentication.getName();
        User user = authService.getProfile(userId);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/forgot-password")
    @com.taskosaur.taskosaur.annotations.RateLimit(limit = 3, period = 300, keyPrefix = "auth_forgot_password", strategy = com.taskosaur.taskosaur.enums.RateLimitStrategy.BY_IP)
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @GetMapping("/verify-reset-token/{token}")
    public ResponseEntity<VerifyResetTokenResponse> verifyResetToken(@PathVariable String token) {
        return ResponseEntity.ok(authService.verifyResetToken(token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/registration-status")
    public ResponseEntity<Map<String, Object>> getRegistrationStatus() {
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.registerUser(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
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

package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.LoginRequest;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.UserStatus;
import com.taskosaur.taskosaur.exceptions.BadRequestException;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public boolean checkUsersExist() {
        return userRepository.count() > 0;
    }

    public Map<String, Object> isSetupRequired() {
        boolean hasSuperAdmin = userRepository.existsByRole(Role.SUPER_ADMIN);

        if (!hasSuperAdmin) {
            return Map.of(
                    "required", true,
                    "canSetup", true,
                    "message", "Setup is required"
            );
        }

        return Map.of(
                "required", false,
                "canSetup", false,
                "message", "Setup has already been completed"
        );
    }

    public AuthResponse setupSuperAdmin(SetupAdminRequest request) {
        boolean hasSuperAdmin = userRepository.existsByRole(Role.SUPER_ADMIN);
        if (hasSuperAdmin) {
            throw new ConflictException("Setup already completed");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use");
        }
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User newUser = User.builder()
                .email(request.getEmail())
                .password(hashedPassword)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername())
                .role(Role.SUPER_ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        User savedUser = userRepository.save(newUser);
        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);
        savedUser.setRefreshToken(refreshToken);
        userRepository.save(savedUser);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(savedUser)
                .message("Super admin setup successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản chưa được kích hoạt hoặc đã bị khóa");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshToken(refreshToken);
        user.setLastLoginAt(LocalDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .message("Login successful")
                .build();
    }
    public User getProfile(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}

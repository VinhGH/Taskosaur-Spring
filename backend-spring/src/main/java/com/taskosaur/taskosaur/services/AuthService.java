package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.LoginRequest;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.UserStatus;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public boolean checkUsersExist(){
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
    public AuthResponse setupSuperAdmin(SetupAdminRequest request){
        boolean hasSuperAdmin = userRepository.existsByRole(Role.SUPER_ADMIN);
        if (hasSuperAdmin) {
            throw new RuntimeException("Setup already completed");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
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
        // 1. Tìm user theo email (ném lỗi nếu không thấy)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác"));

        // 2. So khớp mật khẩu: passwordEncoder.matches(mật khẩu thô, mật khẩu đã hash)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt hoặc đã bị khóa");
        }

        // 4. Sinh token bằng jwtService
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // 5. Cập nhật thông tin đăng nhập vào DB
        user.setRefreshToken(refreshToken);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 6. Trả về AuthResponse
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .message("Login successful")
                .build();
    }
}

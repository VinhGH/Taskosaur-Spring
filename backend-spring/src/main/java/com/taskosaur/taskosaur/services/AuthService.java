package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.auth.AuthResponse;
import com.taskosaur.taskosaur.dto.auth.SetupAdminRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.UserStatus;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        return AuthResponse.builder()
                .accessToken("mock-access-token")
                .refreshToken("mock-refresh-token")
                .user(savedUser)
                .message("Super admin setup successful")
                .build();
    }
}

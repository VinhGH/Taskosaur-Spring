package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.user.UpdateUserRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User update(String id, UpdateUserRequest req, String currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // If username changed, ensure unique
        if (req.getUsername() != null && !req.getUsername().isBlank() && !req.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(req.getUsername())) {
                throw new ConflictException("Username already exists");
            }
            user.setUsername(req.getUsername());
        }

        if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
            user.setFirstName(req.getFirstName());
        }
        if (req.getLastName() != null && !req.getLastName().isBlank()) {
            user.setLastName(req.getLastName());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio());
        }
        if (req.getAvatar() != null) {
            user.setAvatar(req.getAvatar());
        }
        if (req.getMobileNumber() != null) {
            user.setMobileNumber(req.getMobileNumber());
        }
        if (req.getTimezone() != null) {
            user.setTimezone(req.getTimezone());
        }
        if (req.getLanguage() != null) {
            user.setLanguage(req.getLanguage());
        }
        if (req.getDefaultOrganizationId() != null) {
            user.setDefaultOrganizationId(req.getDefaultOrganizationId());
        }

        return userRepository.save(user);
    }

    public void changePassword(String userId, com.taskosaur.taskosaur.dto.user.ChangePasswordRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("User not authenticated");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new com.taskosaur.taskosaur.exceptions.BadRequestException("Mật khẩu hiện tại không chính xác");
        }
        if (request.getConfirmPassword() != null && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new com.taskosaur.taskosaur.exceptions.BadRequestException("Mật khẩu xác nhận không khớp");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}

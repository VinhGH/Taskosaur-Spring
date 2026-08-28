package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.dto.user.UpdateUserRequest;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.exceptions.ConflictException;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.exceptions.UnauthorizedException;
import com.taskosaur.taskosaur.models.User;
import com.taskosaur.taskosaur.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

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
}

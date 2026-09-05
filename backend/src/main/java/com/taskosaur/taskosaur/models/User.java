package com.taskosaur.taskosaur.models;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = true)
    private String password;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(unique = true)
    private String username;

    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Builder.Default
    private String timezone = "UTC";

    @Builder.Default
    private String language = "en";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // Lưu Refresh Token (đã hash hoặc dạng token chuỗi)
    @JsonIgnore
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @JsonIgnore
    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @Column(name = "default_organization_id")
    private String defaultOrganizationId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
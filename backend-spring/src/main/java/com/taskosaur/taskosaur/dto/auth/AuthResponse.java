package com.taskosaur.taskosaur.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taskosaur.taskosaur.models.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    @JsonProperty("access_token")
    private String accessToken;
    @JsonProperty("refresh_token")
    private String refreshToken;

    private User user;

    private String message;
}

package com.taskosaur.taskosaur.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequest {

    @JsonProperty("refresh_token")
    private String refreshToken;
}

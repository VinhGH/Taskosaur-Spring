package com.taskosaur.taskosaur.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String username;
    private String bio;
    private String avatar;
    private String mobileNumber;
    private String timezone;
    private String language;

    @JsonProperty("default_organization_id")
    private String defaultOrganizationId;

    private String role;
}

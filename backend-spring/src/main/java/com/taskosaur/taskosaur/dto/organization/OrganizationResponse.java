package com.taskosaur.taskosaur.dto.organization;

import com.taskosaur.taskosaur.enums.Role;
import com.taskosaur.taskosaur.models.OrganizationMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class OrganizationResponse {
    private String id;
    private String name;
    private String description;
    private String slug;
    private String avatar;
    private String website;
    private String ownerId;
    private Boolean isOwner;
    private Boolean isDefault;
    private Role userRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CountDto _count;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CountDto {
        private long members;
        private long workspaces;
    }


}

package com.taskosaur.taskosaur.dto.chat;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateChannelRequest {

    private String name;
    private String description;
    private Boolean isAnnouncementOnly;
    private Boolean requiresApproval;
    private Boolean isArchived;
}

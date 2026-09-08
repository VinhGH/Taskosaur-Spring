package com.taskosaur.taskosaur.dto.chat;

import com.taskosaur.taskosaur.enums.ChannelType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChannelRequest {

    @NotBlank(message = "Channel name is required")
    private String name;

    private String description;

    @NotBlank(message = "Workspace ID is required")
    private String workspaceId;

    private String projectId;

    @Builder.Default
    private ChannelType type = ChannelType.PUBLIC;

    @Builder.Default
    private Boolean isAnnouncementOnly = false;

    @Builder.Default
    private Boolean requiresApproval = false;
}

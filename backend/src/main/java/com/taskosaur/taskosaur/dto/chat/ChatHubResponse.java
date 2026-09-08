package com.taskosaur.taskosaur.dto.chat;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHubResponse {
    private String workspaceId;
    private String workspaceName;
    private List<ChannelResponse> workspaceChannels;
    private List<ProjectChatGroupResponse> projectGroups;
}

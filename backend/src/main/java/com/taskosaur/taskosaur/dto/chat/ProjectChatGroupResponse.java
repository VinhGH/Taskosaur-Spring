package com.taskosaur.taskosaur.dto.chat;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectChatGroupResponse {
    private String projectId;
    private String projectName;
    private String projectSlug;
    private List<ChannelResponse> channels;
}

package com.taskosaur.taskosaur.dto.chat;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddChannelMembersRequest {

    @NotEmpty(message = "Danh sách userIds không được để trống")
    private List<String> userIds;
}

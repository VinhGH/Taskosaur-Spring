package com.taskosaur.taskosaur.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockUserRequest {

    @NotBlank(message = "Blocked user ID is required")
    private String blockedId;

    private String reason;
}

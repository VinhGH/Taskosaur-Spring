package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMessagesDto {
    @NotEmpty(message = "Messages list cannot be empty")
    @Valid
    private List<ChatMessageDto> messages;
}

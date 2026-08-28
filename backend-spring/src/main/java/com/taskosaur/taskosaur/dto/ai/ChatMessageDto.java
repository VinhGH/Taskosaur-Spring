package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    @NotBlank(message = "Role must not be blank")
    private String role; // "system", "user", "assistant"

    @NotBlank(message = "Content must not be blank")
    private String content;
}

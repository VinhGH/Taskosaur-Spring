package com.taskosaur.taskosaur.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessageDto {
    @NotBlank(message = "Role must not be blank")
    private String role; // "system", "user", "assistant", "tool"

    private String content;

    private String name;

    private String tool_call_id;

    private Object tool_calls;
}


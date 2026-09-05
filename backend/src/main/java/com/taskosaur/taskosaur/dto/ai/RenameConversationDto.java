package com.taskosaur.taskosaur.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenameConversationDto {
    @NotBlank(message = "Title must not be blank")
    private String title;
}

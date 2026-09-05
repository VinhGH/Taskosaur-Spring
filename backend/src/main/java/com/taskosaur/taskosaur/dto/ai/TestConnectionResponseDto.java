package com.taskosaur.taskosaur.dto.ai;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestConnectionResponseDto {
    private boolean success;
    private String message;
    private String error;
}

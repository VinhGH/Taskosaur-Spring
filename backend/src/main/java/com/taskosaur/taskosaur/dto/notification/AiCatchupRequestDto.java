package com.taskosaur.taskosaur.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCatchupRequestDto {
    private String organizationId;
    private Integer limit;
}

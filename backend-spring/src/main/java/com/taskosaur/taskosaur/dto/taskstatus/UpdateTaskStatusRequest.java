package com.taskosaur.taskosaur.dto.taskstatus;

import com.taskosaur.taskosaur.enums.StatusCategory;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskStatusRequest {
    private String name;
    private String description;
    private String color;
    private String icon;
    private StatusCategory category;
    private Integer position;
}

package com.taskosaur.taskosaur.dto.task;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignTaskAssigneesRequest {
    private List<String> assigneeIds;
}

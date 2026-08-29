package com.taskosaur.taskosaur.dto.task;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDeleteTasksRequest {
    private List<String> taskIds;
    private String projectId;
    private Boolean all;
    private List<String> excludedIds;
}

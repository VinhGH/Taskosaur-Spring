package com.taskosaur.taskosaur.models;

import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssigneeId implements Serializable {
    private String taskId;
    private String userId;
}

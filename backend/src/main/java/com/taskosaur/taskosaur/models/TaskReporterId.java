package com.taskosaur.taskosaur.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskReporterId implements Serializable {
    private String taskId;
    private String userId;
}

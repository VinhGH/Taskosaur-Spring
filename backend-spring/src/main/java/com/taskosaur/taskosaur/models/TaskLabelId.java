package com.taskosaur.taskosaur.models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class TaskLabelId implements Serializable {

    @Column(name = "task_id")
    private String taskId;

    @Column(name = "label_id")
    private String labelId;
}

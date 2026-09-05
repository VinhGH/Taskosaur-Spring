package com.taskosaur.taskosaur.models;

import com.taskosaur.taskosaur.enums.ScopeType;
import com.taskosaur.taskosaur.enums.ViewType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_ranks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"task_id", "scope_type", "scope_id", "view_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private ScopeType scopeType;

    @Column(name = "scope_id", nullable = false)
    private String scopeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "view_type", nullable = false)
    private ViewType viewType;

    @Column(name = "rank")
    private Double rank;
}

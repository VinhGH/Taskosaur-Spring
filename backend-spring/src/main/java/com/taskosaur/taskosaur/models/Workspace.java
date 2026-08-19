package com.taskosaur.taskosaur.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;


import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "workspaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Workspace {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String slug;
    @Column(nullable = true,columnDefinition = "TEXT")
    private String description;
    private String color;
    @Column(name = "organization_id", nullable = false)
    private String organizationId;
    @Column(nullable = true,name = "parent_workspace_id")
    private String parentWorkspaceId;
    @Column(nullable = true)
    private String path;
    @Column(name = "created_by_id")
    private String createdBy;
    private boolean archive;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}

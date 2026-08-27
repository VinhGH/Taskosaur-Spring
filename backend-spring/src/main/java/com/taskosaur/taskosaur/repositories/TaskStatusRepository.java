package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskStatusRepository extends JpaRepository<TaskStatus, String> {
    List<TaskStatus> findByWorkflowIdOrderByPositionAsc(String workflowId);
    Optional<TaskStatus> findByWorkflowIdAndIsDefaultTrue(String workflowId);
}
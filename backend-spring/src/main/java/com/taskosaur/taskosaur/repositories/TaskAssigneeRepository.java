package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskAssignee;
import com.taskosaur.taskosaur.models.TaskAssigneeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, TaskAssigneeId> {

    List<TaskAssignee> findByTaskId(String taskId);

    List<TaskAssignee> findByUserId(String userId);

    void deleteByTaskId(String taskId);

    void deleteByTaskIdAndUserId(String taskId, String userId);

    boolean existsByTaskIdAndUserId(String taskId, String userId);
}

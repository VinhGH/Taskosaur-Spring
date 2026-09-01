package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskReporter;
import com.taskosaur.taskosaur.models.TaskReporterId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskReporterRepository extends JpaRepository<TaskReporter, TaskReporterId> {

    List<TaskReporter> findByTaskId(String taskId);

    List<TaskReporter> findByTaskIdIn(List<String> taskIds);

    void deleteByTaskId(String taskId);

    void deleteByTaskIdAndUserId(String taskId, String userId);

    boolean existsByTaskIdAndUserId(String taskId, String userId);
}

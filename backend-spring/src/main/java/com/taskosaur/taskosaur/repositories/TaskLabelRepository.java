package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskLabel;
import com.taskosaur.taskosaur.models.TaskLabelId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, TaskLabelId> {
    List<TaskLabel> findByIdTaskId(String taskId);
    List<TaskLabel> findByIdLabelId(String labelId);
    void deleteByIdTaskId(String taskId);
    void deleteByIdTaskIdAndIdLabelId(String taskId, String labelId);
}

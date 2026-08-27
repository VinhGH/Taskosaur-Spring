package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, String> {

    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(String taskId);
}

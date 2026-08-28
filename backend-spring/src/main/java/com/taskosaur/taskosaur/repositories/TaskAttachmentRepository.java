package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, String> {
    List<TaskAttachment> findByTaskIdOrderByCreatedAtDesc(String taskId);
    void deleteByTaskId(String taskId);
}

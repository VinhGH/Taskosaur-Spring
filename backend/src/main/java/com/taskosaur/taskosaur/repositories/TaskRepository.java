package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findByProjectId(String projectId);

    List<Task> findByProjectIdIn(List<String> projectIds);

    List<Task> findByProjectIdAndStatusId(String projectId, String statusId);

    Optional<Task> findByProjectIdAndTaskNumber(String projectId, Integer taskNumber);

    Optional<Task> findBySlug(String slug);

    @Query("SELECT COALESCE(MAX(t.taskNumber), 0) FROM Task t WHERE t.projectId = :projectId")
    Integer findMaxTaskNumberByProjectId(@Param("projectId") String projectId);

    long countByProjectId(String projectId);

    long countByProjectIdAndStatusId(String projectId, String statusId);

    long countBySprintId(String sprintId);

    List<Task> findBySprintId(String sprintId);
}

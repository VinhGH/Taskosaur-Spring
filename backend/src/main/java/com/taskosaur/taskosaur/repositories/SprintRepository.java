package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.SprintStatus;
import com.taskosaur.taskosaur.models.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, String> {

    List<Sprint> findByProjectId(String projectId);

    List<Sprint> findByProjectIdAndArchiveFalse(String projectId);

    List<Sprint> findByProjectIdAndStatus(String projectId, SprintStatus status);

    List<Sprint> findByProjectIdAndStatusAndArchiveFalse(String projectId, SprintStatus status);

    Optional<Sprint> findByProjectIdAndSlug(String projectId, String slug);

    Optional<Sprint> findFirstByProjectIdAndStatus(String projectId, SprintStatus status);

    boolean existsByProjectIdAndSlug(String projectId, String slug);
}

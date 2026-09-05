package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.PublicTaskShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PublicTaskShareRepository extends JpaRepository<PublicTaskShare, String> {
    Optional<PublicTaskShare> findByToken(String token);
    List<PublicTaskShare> findByTaskId(String taskId);
    Optional<PublicTaskShare> findFirstByTaskIdAndRevokedAtIsNullOrderByCreatedAtDesc(String taskId);
}

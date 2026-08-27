package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {
    List<ActivityLog> findByEntityIdOrderByCreatedAtDesc(String entityId);
    List<ActivityLog> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(String userId);
}

package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, String> {
    List<Workflow> findByOrganizationId(String organizationId);
    Optional<Workflow> findByOrganizationIdAndIsDefaultTrue(String organizationId);
}
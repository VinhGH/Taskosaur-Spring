package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, String> {
    List<Label> findByProjectId(String projectId);
    Optional<Label> findByProjectIdAndName(String projectId, String name);
    List<Label> findByProjectIdAndNameContainingIgnoreCase(String projectId, String query);
}

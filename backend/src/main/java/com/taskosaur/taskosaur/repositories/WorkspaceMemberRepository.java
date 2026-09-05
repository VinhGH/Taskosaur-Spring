package com.taskosaur.taskosaur.repositories;


import com.taskosaur.taskosaur.models.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, String> {
    List<WorkspaceMember> findByWorkspaceId(String workspaceId);
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(String workspaceId, String userId);
    boolean existsByWorkspaceIdAndUserId(String workspaceId, String userId);
    List<WorkspaceMember> findByUserId(String userId);
    long countByWorkspaceId(String workspaceId);
}

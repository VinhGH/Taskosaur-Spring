package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.ScopeType;
import com.taskosaur.taskosaur.enums.ViewType;
import com.taskosaur.taskosaur.models.TaskRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRankRepository extends JpaRepository<TaskRank, String> {
    Optional<TaskRank> findByTaskIdAndScopeTypeAndScopeIdAndViewType(
            String taskId, ScopeType scopeType, String scopeId, ViewType viewType
    );

    List<TaskRank> findByScopeTypeAndScopeIdAndViewTypeOrderByRankAsc(
            ScopeType scopeType, String scopeId, ViewType viewType
    );
}

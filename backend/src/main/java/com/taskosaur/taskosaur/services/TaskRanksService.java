package com.taskosaur.taskosaur.services;

import com.taskosaur.taskosaur.enums.ScopeType;
import com.taskosaur.taskosaur.enums.ViewType;
import com.taskosaur.taskosaur.models.TaskRank;
import com.taskosaur.taskosaur.repositories.TaskRankRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskRanksService {

    private final TaskRankRepository taskRankRepository;

    @Transactional
    public Map<String, Object> reorder(
            String taskId,
            String scopeTypeStr,
            String scopeId,
            String viewTypeStr,
            String afterTaskId,
            String beforeTaskId
    ) {
        ScopeType resolvedScopeType = ScopeType.PROJECT;
        try {
            if (scopeTypeStr != null) {
                resolvedScopeType = ScopeType.valueOf(scopeTypeStr.toUpperCase());
            }
        } catch (IllegalArgumentException _) {
            // Default to PROJECT
        }
        final ScopeType scopeType = resolvedScopeType;

        ViewType resolvedViewType = ViewType.BOARD;
        try {
            if (viewTypeStr != null) {
                resolvedViewType = ViewType.valueOf(viewTypeStr.toUpperCase());
            }
        } catch (IllegalArgumentException _) {
            // Default to BOARD
        }
        final ViewType viewType = resolvedViewType;

        Double afterRank = null;
        if (afterTaskId != null && !afterTaskId.isBlank()) {
            afterRank = taskRankRepository.findByTaskIdAndScopeTypeAndScopeIdAndViewType(
                    afterTaskId, scopeType, scopeId, viewType
            ).map(TaskRank::getRank).orElse(null);
        }

        Double beforeRank = null;
        if (beforeTaskId != null && !beforeTaskId.isBlank()) {
            beforeRank = taskRankRepository.findByTaskIdAndScopeTypeAndScopeIdAndViewType(
                    beforeTaskId, scopeType, scopeId, viewType
            ).map(TaskRank::getRank).orElse(null);
        }

        double newRank = computeRank(afterRank, beforeRank);

        TaskRank taskRank = taskRankRepository.findByTaskIdAndScopeTypeAndScopeIdAndViewType(
                taskId, scopeType, scopeId, viewType
        ).orElseGet(() -> TaskRank.builder()
                .taskId(taskId)
                .scopeType(scopeType)
                .scopeId(scopeId)
                .viewType(viewType)
                .build());

        taskRank.setRank(newRank);
        taskRankRepository.save(taskRank);

        log.info("Updated task rank for taskId={}, scopeType={}, scopeId={}, viewType={}, newRank={}",
                taskId, scopeType, scopeId, viewType, newRank);

        return Map.of(
                "success", true,
                "taskId", taskId,
                "rank", newRank
        );
    }

    private double computeRank(Double predecessorRank, Double successorRank) {
        if (predecessorRank == null && successorRank == null) return 1.0;
        if (predecessorRank == null) return successorRank - 1.0;
        if (successorRank == null) return predecessorRank + 1.0;
        return (predecessorRank + successorRank) / 2.0;
    }
}

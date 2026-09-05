package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, String> {

    List<TimeEntry> findByTaskIdOrderByCreatedAtDesc(String taskId);

    List<TimeEntry> findByUserIdOrderByCreatedAtDesc(String userId);

    List<TimeEntry> findByTaskIdAndUserIdOrderByCreatedAtDesc(String taskId, String userId);

    Optional<TimeEntry> findFirstByUserIdAndStartTimeIsNotNullAndEndTimeIsNull(String userId);

    Optional<TimeEntry> findFirstByTaskIdAndStartTimeIsNotNullAndEndTimeIsNull(String taskId);

    List<TimeEntry> findByTaskIdInOrderByCreatedAtDesc(List<String> taskIds);

    @Query("SELECT te FROM TimeEntry te WHERE te.taskId = :taskId AND te.date >= :startDate AND te.date <= :endDate ORDER BY te.date DESC")
    List<TimeEntry> findByTaskIdAndDateRange(
            @Param("taskId") String taskId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT te FROM TimeEntry te WHERE te.userId = :userId AND te.date >= :startDate AND te.date <= :endDate ORDER BY te.date DESC")
    List<TimeEntry> findByUserIdAndDateRange(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT te FROM TimeEntry te WHERE te.taskId = :taskId AND te.userId = :userId AND te.date >= :startDate AND te.date <= :endDate ORDER BY te.date DESC")
    List<TimeEntry> findByTaskIdAndUserIdAndDateRange(
            @Param("taskId") String taskId,
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

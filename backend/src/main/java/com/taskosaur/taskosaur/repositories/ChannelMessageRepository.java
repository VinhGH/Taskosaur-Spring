package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.ChannelMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMessageRepository extends JpaRepository<ChannelMessage, String> {

    Page<ChannelMessage> findByChannelIdOrderByCreatedAtAsc(String channelId, Pageable pageable);

    List<ChannelMessage> findByChannelIdOrderByCreatedAtAsc(String channelId);

    Optional<ChannelMessage> findByIdAndChannelId(String id, String channelId);

    void deleteByChannelId(String channelId);

    @Query("""
        SELECT COUNT(m) FROM ChannelMessage m 
        WHERE m.channelId = :channelId 
          AND m.createdAt > :since
          AND m.isDeleted = false
    """)
    long countUnreadMessages(@Param("channelId") String channelId, @Param("since") LocalDateTime since);

    @Query("""
        SELECT m FROM ChannelMessage m 
        WHERE m.channelId = :channelId 
        ORDER BY m.createdAt DESC 
        LIMIT 1
    """)
    Optional<ChannelMessage> findLatestMessageInChannel(@Param("channelId") String channelId);
}

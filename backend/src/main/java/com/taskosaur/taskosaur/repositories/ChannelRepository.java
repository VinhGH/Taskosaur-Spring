package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.ChannelType;
import com.taskosaur.taskosaur.models.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, String> {

    List<Channel> findByWorkspaceIdAndIsArchivedFalseOrderByCreatedAtAsc(String workspaceId);

    List<Channel> findByWorkspaceIdAndProjectIdAndIsArchivedFalseOrderByCreatedAtAsc(String workspaceId, String projectId);

    List<Channel> findByWorkspaceIdAndProjectIdIsNullAndIsArchivedFalseOrderByCreatedAtAsc(String workspaceId);

    Optional<Channel> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

    @Query("""
        SELECT c FROM Channel c 
        WHERE c.workspaceId = :workspaceId 
          AND c.projectId IS NULL
          AND c.isArchived = false
          AND (
            c.type = 'PUBLIC' 
            OR c.type = 'ANNOUNCEMENT'
            OR EXISTS (
                SELECT 1 FROM ChannelMember cm 
                WHERE cm.channelId = c.id AND cm.userId = :userId
            )
          )
        ORDER BY c.createdAt ASC
    """)
    List<Channel> findAccessibleChannelsForUser(
        @Param("workspaceId") String workspaceId, 
        @Param("userId") String userId
    );

    @Query("""
        SELECT c FROM Channel c 
        WHERE c.projectId = :projectId 
          AND c.isArchived = false
          AND (
            c.type = 'PUBLIC' 
            OR c.type = 'ANNOUNCEMENT'
            OR EXISTS (
                SELECT 1 FROM ChannelMember cm 
                WHERE cm.channelId = c.id AND cm.userId = :userId
            )
          )
        ORDER BY c.createdAt ASC
    """)
    List<Channel> findAccessibleProjectChannelsForUser(
        @Param("projectId") String projectId, 
        @Param("userId") String userId
    );
}

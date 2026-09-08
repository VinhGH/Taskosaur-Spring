package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.enums.JoinRequestStatus;
import com.taskosaur.taskosaur.models.ChannelJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelJoinRequestRepository extends JpaRepository<ChannelJoinRequest, String> {

    List<ChannelJoinRequest> findByChannelIdOrderByCreatedAtDesc(String channelId);

    List<ChannelJoinRequest> findByChannelIdAndStatusOrderByCreatedAtDesc(String channelId, JoinRequestStatus status);

    Optional<ChannelJoinRequest> findByChannelIdAndUserIdAndStatus(String channelId, String userId, JoinRequestStatus status);

    boolean existsByChannelIdAndUserIdAndStatus(String channelId, String userId, JoinRequestStatus status);

    void deleteByChannelId(String channelId);

    long countByChannelIdAndStatus(String channelId, JoinRequestStatus status);
}

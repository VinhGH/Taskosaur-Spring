package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, String> {

    List<UserBlock> findByBlockerId(String blockerId);

    Optional<UserBlock> findByBlockerIdAndBlockedId(String blockerId, String blockedId);

    boolean existsByBlockerIdAndBlockedId(String blockerId, String blockedId);

    void deleteByBlockerIdAndBlockedId(String blockerId, String blockedId);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END 
        FROM UserBlock b 
        WHERE (b.blockerId = :userA AND b.blockedId = :userB) 
           OR (b.blockerId = :userB AND b.blockedId = :userA)
    """)
    boolean isBlockExistsBetween(@Param("userA") String userA, @Param("userB") String userB);
}

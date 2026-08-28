package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, String> {
    // Lấy tất cả hội thoại của 1 user, mới nhất trước
    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(String userId);
    // Tìm theo sessionId để tiếp tục hội thoại cũ
    Optional<AiConversation> findBySessionId(String sessionId);
    // Kiểm tra quyền sở hữu: sessionId phải thuộc về đúng user
    Optional<AiConversation> findBySessionIdAndUserId(String sessionId, String userId);
}

package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, String> {
    // Lấy tất cả tin nhắn của 1 cuộc trò chuyện theo thứ tự thời gian
    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    // Xóa tất cả tin nhắn của 1 cuộc trò chuyện bằng bulk DELETE (tránh concurrent StaleStateException)
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM AiMessage m WHERE m.conversationId = :conversationId")
    void deleteByConversationId(@org.springframework.data.repository.query.Param("conversationId") String conversationId);
}

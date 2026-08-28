package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, String> {
    // Lấy tất cả tin nhắn của 1 cuộc trò chuyện theo thứ tự thời gian
    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    // Xóa tất cả tin nhắn của 1 cuộc trò chuyện
    void deleteByConversationId(String conversationId);
}

package com.taskosaur.taskosaur.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskosaur.taskosaur.dto.ai.*;
import com.taskosaur.taskosaur.enums.MessageRole;
import com.taskosaur.taskosaur.exceptions.ResourceNotFoundException;
import com.taskosaur.taskosaur.models.AiConversation;
import com.taskosaur.taskosaur.models.AiMessage;
import com.taskosaur.taskosaur.repositories.AiConversationRepository;
import com.taskosaur.taskosaur.repositories.AiMessageRepository;
import io.github.cdimascio.dotenv.Dotenv;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final ObjectMapper objectMapper;
    private final Dotenv dotenv;

    @Value("${ai.openrouter.api-key:}")
    private String configuredApiKey;

    @Value("${ai.openrouter.api-url:https://openrouter.ai/api/v1}")
    private String configuredApiUrl;

    @Value("${ai.openrouter.model:openai/gpt-4o-mini}")
    private String configuredModel;

    @Value("${ai.openrouter.max-tokens:4000}")
    private int configuredMaxTokens;

    @Value("${ai.openrouter.timeout-ms:60000}")
    private int configuredTimeoutMs;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private String getEffectiveApiKey() {
        if (configuredApiKey != null && !configuredApiKey.isBlank() && !configuredApiKey.contains("your-key-here")) {
            return configuredApiKey;
        }
        String envKey = dotenv.get("OPENROUTER_API_KEY");
        if (envKey != null && !envKey.isBlank() && !envKey.contains("your-key-here")) {
            return envKey;
        }
        return System.getenv("OPENROUTER_API_KEY");
    }

    private String getEffectiveApiUrl() {
        if (configuredApiUrl != null && !configuredApiUrl.isBlank()) {
            return configuredApiUrl;
        }
        String envUrl = dotenv.get("OPENROUTER_API_URL");
        return envUrl != null && !envUrl.isBlank() ? envUrl : "https://openrouter.ai/api/v1";
    }

    private String getEffectiveModel() {
        if (configuredModel != null && !configuredModel.isBlank()) {
            return configuredModel;
        }
        String envModel = dotenv.get("OPENROUTER_MODEL");
        return envModel != null && !envModel.isBlank() ? envModel : "openai/gpt-4o-mini";
    }

    // =========================================================================
    // CONVERSATIONS MANAGEMENT
    // =========================================================================

    public List<ConversationResponseDto> getConversations(String userId) {
        List<AiConversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return conversations.stream().map(c -> {
            List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
            List<ChatMessageDto> msgDtos = messages.stream().map(m ->
                    ChatMessageDto.builder()
                            .role(m.getRole().name().toLowerCase())
                            .content(m.getContent())
                            .build()
            ).toList();

            return ConversationResponseDto.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .sessionId(c.getSessionId())
                    .userId(c.getUserId())
                    .createdAt(c.getCreatedAt())
                    .updatedAt(c.getUpdatedAt())
                    .messages(msgDtos)
                    .build();
        }).toList();
    }

    public ConversationResponseDto createConversation(String userId, CreateConversationDto dto) {
        String sessionId = (dto != null && dto.getSessionId() != null && !dto.getSessionId().isBlank())
                ? dto.getSessionId()
                : UUID.randomUUID().toString();

        String title = (dto != null && dto.getTitle() != null && !dto.getTitle().isBlank())
                ? dto.getTitle()
                : "New Chat";

        AiConversation conversation = AiConversation.builder()
                .sessionId(sessionId)
                .title(title)
                .userId(userId)
                .build();

        AiConversation saved = conversationRepository.save(conversation);

        return ConversationResponseDto.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .sessionId(saved.getSessionId())
                .userId(saved.getUserId())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .messages(List.of())
                .build();
    }

    public ConversationResponseDto renameConversation(String userId, String id, RenameConversationDto dto) {
        AiConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        if (!conversation.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to edit this conversation");
        }

        conversation.setTitle(dto.getTitle());
        AiConversation saved = conversationRepository.save(conversation);

        List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(saved.getId());
        List<ChatMessageDto> msgDtos = messages.stream().map(m ->
                ChatMessageDto.builder()
                        .role(m.getRole().name().toLowerCase())
                        .content(m.getContent())
                        .build()
        ).toList();

        return ConversationResponseDto.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .sessionId(saved.getSessionId())
                .userId(saved.getUserId())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .messages(msgDtos)
                .build();
    }

    public void deleteConversation(String userId, String id) {
        AiConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        if (!conversation.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to delete this conversation");
        }

        messageRepository.deleteByConversationId(conversation.getId());
        conversationRepository.delete(conversation);
    }

    public ConversationResponseDto updateMessages(String userId, String id, UpdateMessagesDto dto) {
        AiConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        if (!conversation.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Not authorized to update this conversation");
        }

        messageRepository.deleteByConversationId(conversation.getId());

        if (dto.getMessages() != null) {
            for (ChatMessageDto m : dto.getMessages()) {
                MessageRole role = parseRole(m.getRole());
                AiMessage message = AiMessage.builder()
                        .conversationId(conversation.getId())
                        .role(role)
                        .content(m.getContent())
                        .build();
                messageRepository.save(message);
            }
        }

        List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<ChatMessageDto> msgDtos = messages.stream().map(m ->
                ChatMessageDto.builder()
                        .role(m.getRole().name().toLowerCase())
                        .content(m.getContent())
                        .build()
        ).toList();

        return ConversationResponseDto.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .sessionId(conversation.getSessionId())
                .userId(conversation.getUserId())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(msgDtos)
                .build();
    }

    public Map<String, Boolean> clearContext(String userId, String sessionId) {
        Optional<AiConversation> convOpt = conversationRepository.findBySessionIdAndUserId(sessionId, userId);
        if (convOpt.isPresent()) {
            AiConversation conv = convOpt.get();
            messageRepository.deleteByConversationId(conv.getId());
        }
        return Map.of("success", true);
    }

    // =========================================================================
    // AI CHAT COMPLETION & LLM INVOCATION
    // =========================================================================

    public ChatResponseDto chat(ChatRequestDto request, String userId) {
        try {
            String apiKey = getEffectiveApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                return ChatResponseDto.ofError("OpenRouter API key is not configured. Please configure it in .env or settings.");
            }

            // Find or create conversation by sessionId
            String sessionId = request.getSessionId() != null && !request.getSessionId().isBlank()
                    ? request.getSessionId()
                    : UUID.randomUUID().toString();

            AiConversation conversation = conversationRepository.findBySessionId(sessionId)
                    .orElseGet(() -> conversationRepository.save(AiConversation.builder()
                            .sessionId(sessionId)
                            .userId(userId)
                            .title(generateDefaultTitle(request.getMessage()))
                            .build()));

            // Build full message history for LLM
            List<ChatMessageDto> fullHistory = new ArrayList<>();

            // Add system prompt
            fullHistory.add(ChatMessageDto.builder()
                    .role("system")
                    .content(getSystemPrompt())
                    .build());

            // Add existing history from DB if not provided in request
            if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                fullHistory.addAll(request.getHistory());
            } else {
                List<AiMessage> dbMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
                for (AiMessage dbMsg : dbMessages) {
                    fullHistory.add(ChatMessageDto.builder()
                            .role(dbMsg.getRole().name().toLowerCase())
                            .content(dbMsg.getContent())
                            .build());
                }
            }

            // Add the new user message
            fullHistory.add(ChatMessageDto.builder()
                    .role("user")
                    .content(request.getMessage())
                    .build());

            // Normalize messages: drop empty and merge consecutive identical roles
            List<ChatMessageDto> normalized = normalizeMessages(fullHistory);

            // Call OpenRouter / LLM
            String aiAnswer = callLlm(normalized, apiKey, getEffectiveApiUrl(), getEffectiveModel(), configuredMaxTokens);

            // Persist user message to DB
            AiMessage userMsg = AiMessage.builder()
                    .conversationId(conversation.getId())
                    .role(MessageRole.USER)
                    .content(request.getMessage())
                    .build();
            messageRepository.save(userMsg);

            // Persist AI response to DB
            AiMessage assistantMsg = AiMessage.builder()
                    .conversationId(conversation.getId())
                    .role(MessageRole.ASSISTANT)
                    .content(aiAnswer)
                    .build();
            messageRepository.save(assistantMsg);

            // Update conversation title if default
            if ("New Chat".equals(conversation.getTitle())) {
                conversation.setTitle(generateDefaultTitle(request.getMessage()));
                conversationRepository.save(conversation);
            }

            return ChatResponseDto.ofSuccess(aiAnswer);
        } catch (Exception e) {
            log.error("AI Chat failed", e);
            return ChatResponseDto.ofError("AI Chat error: " + e.getMessage());
        }
    }

    public TestConnectionResponseDto testConnection(TestConnectionDto dto) {
        try {
            String apiKey = (dto.getApiKey() != null && !dto.getApiKey().isBlank())
                    ? dto.getApiKey()
                    : getEffectiveApiKey();

            if (apiKey == null || apiKey.isBlank()) {
                return TestConnectionResponseDto.builder()
                        .success(false)
                        .error("API Key must not be empty.")
                        .build();
            }

            List<ChatMessageDto> testMessages = List.of(
                    ChatMessageDto.builder().role("user").content("Hello! Say 'Connection OK' if you can read this.").build()
            );

            String response = callLlm(testMessages, apiKey, dto.getApiUrl(), dto.getModel(), 100);

            return TestConnectionResponseDto.builder()
                    .success(true)
                    .message("Connected successfully: " + response)
                    .build();
        } catch (Exception e) {
            log.error("Test connection failed", e);
            return TestConnectionResponseDto.builder()
                    .success(false)
                    .error("Connection failed: " + e.getMessage())
                    .build();
        }
    }

    public GenerateDescriptionResponseDto generateDescription(GenerateDescriptionDto dto, String userId) {
        try {
            String apiKey = getEffectiveApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                return GenerateDescriptionResponseDto.builder()
                        .success(false)
                        .error("AI API Key not configured")
                        .build();
            }

            String prompt = String.format(
                    "You are a helpful project manager assistant. Generate a clear, concise, and structured task description in Markdown for a task with title: '%s' and type: '%s'. Include Acceptance Criteria and checklist where appropriate. Output ONLY the description content.",
                    dto.getTitle(),
                    dto.getTaskType() != null ? dto.getTaskType() : "TASK"
            );

            List<ChatMessageDto> messages = List.of(
                    ChatMessageDto.builder().role("system").content("You are an expert technical project management assistant.").build(),
                    ChatMessageDto.builder().role("user").content(prompt).build()
            );

            String description = callLlm(messages, apiKey, getEffectiveApiUrl(), getEffectiveModel(), 1000);

            return GenerateDescriptionResponseDto.builder()
                    .description(description)
                    .success(true)
                    .build();
        } catch (Exception e) {
            log.error("Generate description failed", e);
            return GenerateDescriptionResponseDto.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    private String callLlm(List<ChatMessageDto> messages, String apiKey, String rawUrl, String model, int maxTokens) throws Exception {
        String endpointUrl = rawUrl.trim();
        if (!endpointUrl.endsWith("/chat/completions")) {
            if (endpointUrl.endsWith("/")) {
                endpointUrl = endpointUrl + "chat/completions";
            } else {
                endpointUrl = endpointUrl + "/chat/completions";
            }
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", model);
        payload.put("messages", messages);
        payload.put("max_tokens", maxTokens);
        payload.put("temperature", 0.3);

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpointUrl))
                .timeout(Duration.ofMillis(configuredTimeoutMs))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .header("HTTP-Referer", "http://localhost:3000")
                .header("X-Title", "Taskosaur AI Assistant")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String errorMsg = extractErrorMessage(response.body(), response.statusCode());
            throw new RuntimeException(errorMsg);
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.get("choices");
        if (choices != null && choices.isArray() && !choices.isEmpty()) {
            JsonNode messageNode = choices.get(0).get("message");
            if (messageNode != null && messageNode.has("content")) {
                return messageNode.get("content").asText().trim();
            }
        }

        return "No response generated from AI model.";
    }

    private String extractErrorMessage(String responseBody, int statusCode) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.has("error")) {
                JsonNode errNode = root.get("error");
                if (errNode.isTextual()) {
                    return errNode.asText();
                } else if (errNode.has("message")) {
                    return errNode.get("message").asText();
                }
            }
            if (root.has("message")) {
                return root.get("message").asText();
            }
        } catch (Exception ignored) {
        }
        return "LLM API returned status " + statusCode + ": " + responseBody;
    }

    private List<ChatMessageDto> normalizeMessages(List<ChatMessageDto> messages) {
        List<ChatMessageDto> out = new ArrayList<>();
        for (ChatMessageDto msg : messages) {
            if (msg == null || msg.getContent() == null || msg.getContent().isBlank()) continue;

            if (!out.isEmpty()) {
                ChatMessageDto prev = out.get(out.size() - 1);
                if (prev.getRole().equalsIgnoreCase(msg.getRole())) {
                    prev.setContent(prev.getContent() + "\n\n" + msg.getContent());
                    continue;
                }
            }
            out.add(ChatMessageDto.builder()
                    .role(msg.getRole().toLowerCase())
                    .content(msg.getContent())
                    .build());
        }
        return out;
    }

    private MessageRole parseRole(String roleStr) {
        if (roleStr == null) return MessageRole.USER;
        return switch (roleStr.toLowerCase()) {
            case "assistant" -> MessageRole.ASSISTANT;
            case "system" -> MessageRole.SYSTEM;
            default -> MessageRole.USER;
        };
    }

    private String generateDefaultTitle(String prompt) {
        if (prompt == null || prompt.isBlank()) return "New Chat";
        String clean = prompt.replaceAll("\n", " ").trim();
        return clean.length() > 30 ? clean.substring(0, 30) + "..." : clean;
    }

    private String getSystemPrompt() {
        return """
                You are Taskosaur AI Assistant, a smart project management companion.
                Your purpose is to help users manage tasks, organize workflows, analyze project status, and guide them through using Taskosaur efficiently.
                Be polite, concise, and helpful. Always respond clearly with well-structured answers.
                """;
    }
}

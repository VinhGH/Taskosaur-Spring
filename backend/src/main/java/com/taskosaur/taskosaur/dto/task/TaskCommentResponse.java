package com.taskosaur.taskosaur.dto.task;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCommentResponse {

    private String id;
    private String content;
    private String taskId;
    private String authorId;
    private String parentCommentId;
    private AuthorDto author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AuthorDto {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String avatar;
    }
}

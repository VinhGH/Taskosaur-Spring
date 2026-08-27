package com.taskosaur.taskosaur.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskCommentRequest {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(min = 1, max = 10000, message = "Nội dung bình luận tối đa 10000 ký tự")
    private String content;

    private String parentCommentId;
}

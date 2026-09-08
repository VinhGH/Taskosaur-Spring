package com.taskosaur.taskosaur.dto.chat;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibleMemberResponse {

    private String id;
    private String name;
    private String email;
    private String avatar;
    private String role;
    private String source; // "WORKSPACE" or "PROJECT"
}

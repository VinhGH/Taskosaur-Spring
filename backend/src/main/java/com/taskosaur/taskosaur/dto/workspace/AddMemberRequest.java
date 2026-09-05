package com.taskosaur.taskosaur.dto.workspace;

import com.taskosaur.taskosaur.enums.WorkspaceRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddMemberRequest {
    @NotBlank(message = " user ID không được để trống")
    private String userId;


    @NotBlank(message = " workspace Id không được để trống")
    private String workspaceId;

    @NotNull(message = "Role không được để trống")
    private WorkspaceRole role;
}

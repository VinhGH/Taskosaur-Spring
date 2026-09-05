package com.taskosaur.taskosaur.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetupAdminRequest {
    @Email
    @NotBlank(message = "Email không được để trống ")
    private String email;

    @NotBlank( message = "Mật khẩu không được để trống")
    @Size(min = 6,message = "Mật khẩu phải ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Tên không được để trống")
    private String firstName;

    @NotBlank(message = "Họ không được để trống")
    private String lastName;

    private String username;
}

package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@Schema(description = "Login credentials")
public class LoginRequest {

    @NotBlank
    @Email
    @Schema(description = "User email address", example = "user@equix.com")
    private String email;

    @NotBlank
    @Schema(description = "User password", example = "Password123")
    private String password;

}

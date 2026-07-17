package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Password reset request — send reset email")
public class PasswordResetRequest {

    @Schema(description = "Email address of the account to reset", example = "user@equix.com")
    private String email;
}

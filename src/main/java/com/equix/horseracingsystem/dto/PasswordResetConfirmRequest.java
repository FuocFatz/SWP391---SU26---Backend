package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Password reset confirmation — validate token and set new password")
public class PasswordResetConfirmRequest {

    @Schema(description = "Reset token received via email")
    private String token;

    @Schema(description = "New password (min 8 chars, must contain letters and digits)", example = "NewSecure1")
    private String newPassword;
}

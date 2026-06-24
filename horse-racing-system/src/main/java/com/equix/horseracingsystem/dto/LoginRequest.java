package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Login credentials")
public class LoginRequest {

    @Schema(description = "User email address", example = "user@equix.com")
    private String email;

    @Schema(description = "User password", example = "Password123")
    private String password;

}
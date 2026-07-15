package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "New user registration data")
public class RegisterRequest {

    @Schema(description = "Username", example = "john_doe")
    private String username;

    @Schema(description = "Full display name", example = "John Doe")
    private String fullName;

    @Schema(description = "Email address", example = "john@equix.com")
    private String email;

    @Schema(description = "Password (min 8 chars, must contain letters and digits)", example = "SecurePass1")
    private String password;

    @Schema(description = "Phone number", example = "+84901234567")
    private String phone;

    @Schema(description = "User role (OWNER, JOCKEY, REFEREE, SPECTATOR)", example = "OWNER")
    private String role;

}
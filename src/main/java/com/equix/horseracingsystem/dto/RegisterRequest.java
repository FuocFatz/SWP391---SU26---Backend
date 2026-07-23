package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Data
@Schema(description = "New user registration data")
public class RegisterRequest {

    @NotBlank
    @Size(min = 3, max = 100)
    @Schema(description = "Username", example = "john_doe")
    private String username;

    @NotBlank
    @Size(min = 2, max = 150)
    @Schema(description = "Full display name", example = "John Doe")
    private String fullName;

    @NotBlank
    @Email
    @Schema(description = "Email address", example = "john@equix.com")
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must include at least one letter and one number")
    @Schema(description = "Password (min 8 chars, must contain letters and digits)", example = "SecurePass1")
    private String password;

    @Schema(description = "Phone number", example = "+84901234567")
    private String phone;

    @NotBlank
    @Schema(description = "Public role (HORSE_OWNER, JOCKEY, SPECTATOR)", example = "HORSE_OWNER")
    private String role;

}

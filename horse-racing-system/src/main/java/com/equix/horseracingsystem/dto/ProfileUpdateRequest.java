package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank
    @Size(min = 2, max = 150)
    private String fullName;

    @Size(max = 30)
    @Pattern(regexp = "^[+0-9() .-]*$", message = "must be a valid phone number")
    private String phone;
}

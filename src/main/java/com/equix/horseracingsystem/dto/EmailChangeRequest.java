package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailChangeRequest {
    @NotBlank
    @Email
    private String newEmail;

    @NotBlank
    private String currentPassword;
}

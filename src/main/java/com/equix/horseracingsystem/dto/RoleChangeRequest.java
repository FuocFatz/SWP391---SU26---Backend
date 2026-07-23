package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleChangeRequest {
    @NotBlank
    private String role;

    @NotBlank
    @Size(min = 20, max = 1000)
    private String reason;
}

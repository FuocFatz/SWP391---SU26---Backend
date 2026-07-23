package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailChangeConfirmRequest {
    @NotBlank
    private String token;
}

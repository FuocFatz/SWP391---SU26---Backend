package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AccountStatusRequest {
    @NotBlank
    private String status;
    private String reason;
}

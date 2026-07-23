package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DnfRequest {
    @NotBlank
    @Size(min = 10, max = 1000)
    private String reason;
}

package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminReportRevisionRequest {
    @NotBlank
    @Size(min = 20, max = 2000)
    private String reason;
}

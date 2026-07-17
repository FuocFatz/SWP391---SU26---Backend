package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RaceReportRequest {
    @NotBlank
    private String description;
    private String actionTaken;
    private String severity;
}

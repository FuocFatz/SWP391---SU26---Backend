package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RaceReportRequest {
    @NotBlank
    @Size(min = 20, max = 4000)
    private String description;
    private String actionTaken;
    private String severity;

    @AssertTrue(message = "All incidents and race notes must be reviewed before report submission")
    private Boolean reviewedIncidents;

    @NotBlank
    @Size(max = 150)
    private String signature;
}

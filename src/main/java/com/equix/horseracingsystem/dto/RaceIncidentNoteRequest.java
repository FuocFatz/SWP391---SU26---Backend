package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RaceIncidentNoteRequest {
    private Long registrationId;

    @NotBlank
    private String category;

    @NotBlank
    private String severity;

    @NotBlank
    @Size(min = 10, max = 4000)
    private String description;

    private String actionTaken;
    private Integer raceTimeSeconds;
}

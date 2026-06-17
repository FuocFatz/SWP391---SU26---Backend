package com.equix.horseracingsystem.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RaceResultRequest {
    private Long registrationId;
    private Integer finishPosition;
    private BigDecimal finishTimeSeconds;
    private String violationNotes;
}

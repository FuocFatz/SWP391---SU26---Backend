package com.equix.horseracingsystem.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class PredictionResponse {
    private Long id;
    private Long raceId;
    private Long spectatorId;
    private Long predictedHorseId;
    private Integer wagerPoints;
    private String status;
}

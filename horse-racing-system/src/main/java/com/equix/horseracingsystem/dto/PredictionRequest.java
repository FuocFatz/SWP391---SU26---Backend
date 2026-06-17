package com.equix.horseracingsystem.dto;

import lombok.Data;

@Data
public class PredictionRequest {
    private Long spectatorId;
    private Long predictedHorseId;
    private Integer wagerPoints;
}

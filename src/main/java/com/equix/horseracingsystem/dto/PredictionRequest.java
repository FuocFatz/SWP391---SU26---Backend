package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Spectator prediction request for a race")
public class PredictionRequest {

    @Schema(description = "Spectator user ID", example = "5")
    private Long spectatorId;

    @Schema(description = "Predicted winning horse ID", example = "3")
    private Long predictedHorseId;

    @Schema(description = "Points wagered on this prediction", example = "10")
    private Integer wagerPoints;
}

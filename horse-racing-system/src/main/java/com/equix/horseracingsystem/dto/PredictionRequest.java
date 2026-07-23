package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
@Schema(description = "Spectator prediction request for a race")
public class PredictionRequest {

    @Schema(description = "Race ID (used by /api/predictions)", example = "1")
    private Long raceId;

    @Schema(description = "Spectator user ID", example = "5")
    private Long spectatorId;

    @Schema(description = "Predicted winning horse ID", example = "3")
    private Long predictedHorseId;

    @Schema(description = "Points wagered on this prediction", example = "10")
    @Min(0)
    @Max(100000)
    private Integer wagerPoints;
}

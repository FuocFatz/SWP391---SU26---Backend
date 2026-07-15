package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Race registration request — registers a horse+jockey pair into a race")
public class RaceRegistrationRequest {

    @Schema(description = "Race ID", example = "10")
    private Long raceId;

    @Schema(description = "Horse ID to register", example = "2")
    private Long horseId;

    @Schema(description = "Owner user ID", example = "1")
    private Long ownerId;

    @Schema(description = "Jockey user ID", example = "3")
    private Long jockeyId;
}


package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Race registration request — registers a horse into a race")
public class RaceRegistrationRequest {

    @Schema(description = "Horse ID to register", example = "2")
    private Long horseId;

    @Schema(description = "Owner user ID", example = "1")
    private Long ownerId;
}

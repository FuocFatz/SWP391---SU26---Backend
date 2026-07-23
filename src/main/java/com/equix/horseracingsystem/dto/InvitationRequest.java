package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Jockey invitation request from owner")
public class InvitationRequest {

    @Schema(description = "Race ID", example = "1")
    private Long raceId;

    @Schema(description = "Horse ID", example = "2")
    private Long horseId;

    @Schema(description = "Owner user ID", example = "1")
    private Long ownerId;

    @Schema(description = "Jockey user ID to invite", example = "3")
    private Long jockeyId;

    @Schema(description = "Personal message to the jockey", example = "Would you like to ride Thunder in the Spring Cup?")
    private String message;
}

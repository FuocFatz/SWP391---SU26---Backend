package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Referee health-check decision for a registration")
public class RefereeCheckRequest {

    @Schema(description = "Whether the horse passed the health check", example = "true")
    private Boolean approved;

    @Schema(description = "Health check status detail", example = "PASSED")
    private String healthCheckStatus;

    @Schema(description = "Additional notes from referee", example = "Horse in excellent condition")
    private String notes;
}

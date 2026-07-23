package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
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

    @Size(max = 1000)
    @Schema(description = "Mandatory reason of at least 20 characters when the entry is disqualified")
    private String disqualificationReason;

    @Schema(description = "MEDICAL, RULE_VIOLATION, EQUIPMENT_FAILURE, ADMINISTRATIVE, or OTHER")
    private String category;

    @Schema(description = "MINOR, MAJOR, or CRITICAL")
    private String severity;

    @Schema(description = "Must equal CONFIRM when disqualifying an entry")
    private String confirmationText;
}

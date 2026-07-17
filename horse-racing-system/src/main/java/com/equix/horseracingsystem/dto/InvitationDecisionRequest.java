package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Jockey response to an invitation")
public class InvitationDecisionRequest {

    @Schema(description = "Decision status (ACCEPTED or DECLINED)", example = "ACCEPTED")
    private String status;

    @Schema(description = "Optional note from jockey", example = "Happy to join!")
    private String responseNote;
}

package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Individual race result entry")
public class RaceResultRequest {

    @Schema(description = "Registration ID of the horse/jockey entry", example = "1")
    private Long registrationId;

    @Schema(description = "Final finish position (1 = winner)", example = "1")
    private Integer finishPosition;

    @Schema(description = "Finish time in seconds", example = "65.42")
    private BigDecimal finishTimeSeconds;

    @Schema(description = "Any violation notes from referee", example = "Clean race")
    private String violationNotes;

    @Schema(description = "Whether the entry did not finish")
    private Boolean dnf;

    @Schema(description = "Whether the entry was disqualified; violationNotes is mandatory when true")
    private Boolean disqualified;
}

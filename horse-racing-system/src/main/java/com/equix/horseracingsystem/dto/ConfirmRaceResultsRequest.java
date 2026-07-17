package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Confirm race results wrapper containing a list of individual results")
public class ConfirmRaceResultsRequest {

    @Schema(description = "List of race result entries")
    private List<RaceResultRequest> results;
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.PredictionRequest;
import com.equix.horseracingsystem.dto.PredictionResponse;
import com.equix.horseracingsystem.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/predictions")
@CrossOrigin("*")
@Tag(name = "Predictions", description = "Spectator prediction management")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @Operation(summary = "Get all predictions",
            description = "Retrieves predictions. Optionally filter by spectatorId or raceId.")
    @ApiResponse(responseCode = "200", description = "List of predictions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PredictionResponse.class))))
    @GetMapping
    public List<PredictionResponse> getAll(
            @Parameter(description = "Filter by spectator user ID") @RequestParam(required = false) Long spectatorId,
            @Parameter(description = "Filter by race ID") @RequestParam(required = false) Long raceId) {
        return predictionService.getAllPredictions(spectatorId, raceId);
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasRole('SPECTATOR')")
    public List<PredictionResponse> getMyHistory() {
        return predictionService.getMyHistory();
    }

    @PutMapping("/races/{raceId}/settle")
    public List<PredictionResponse> settle(@PathVariable Long raceId) {
        return predictionService.settle(raceId);
    }

    @Operation(summary = "Place a prediction",
            description = "Spectator places a prediction on a horse for a race. Only allowed before race goes to STANDBY.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction placed successfully",
                    content = @Content(schema = @Schema(implementation = PredictionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or race in wrong status",
                    content = @Content)
    })
    @PostMapping
    @PreAuthorize("hasRole('SPECTATOR')")
    public PredictionResponse createPrediction(@RequestBody PredictionRequest request) {
        return predictionService.createPrediction(request);
    }
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Prediction;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.Notification;
import com.equix.horseracingsystem.repository.NotificationRepository;
import com.equix.horseracingsystem.repository.PredictionRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin("*")
@Tag(name = "Predictions", description = "Spectator prediction management")
public class PredictionController {

    private final PredictionRepository predictionRepository;
    private final RaceRepository raceRepository;
    private final NotificationRepository notificationRepository;

    public PredictionController(PredictionRepository predictionRepository, RaceRepository raceRepository, NotificationRepository notificationRepository) {
        this.predictionRepository = predictionRepository;
        this.raceRepository = raceRepository;
        this.notificationRepository = notificationRepository;
    }

    @Operation(summary = "Get all predictions",
            description = "Retrieves predictions. Optionally filter by spectatorId or raceId.")
    @ApiResponse(responseCode = "200", description = "List of predictions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Prediction.class))))
    @GetMapping
    public List<Prediction> getAll(
            @Parameter(description = "Filter by spectator user ID") @RequestParam(required = false) Long spectatorId,
            @Parameter(description = "Filter by race ID") @RequestParam(required = false) Long raceId) {
        if (spectatorId != null) {
            return predictionRepository.findBySpectatorId(spectatorId);
        }
        if (raceId != null) {
            return predictionRepository.findByRaceId(raceId);
        }
        return predictionRepository.findAll();
    }

    @Operation(summary = "Place a prediction",
            description = "Spectator places a prediction on a horse for a race. Only allowed before race goes to STANDBY.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction placed successfully",
                    content = @Content(schema = @Schema(implementation = Prediction.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or race in wrong status",
                    content = @Content)
    })
    @PostMapping
    public Prediction createPrediction(@RequestBody Prediction prediction) {
        // Basic validation: race must exist and be in a state that allows placing guesses
        if (prediction.getRaceId() == null || prediction.getSpectatorId() == null || prediction.getPredictedHorseId() == null) {
            throw new IllegalArgumentException("raceId, spectatorId and predictedHorseId are required");
        }

        Race race = raceRepository.findById(prediction.getRaceId()).orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Disallow placing guess if race status is STANDBY or beyond
        String status = race.getStatus();
        if (status != null) {
            String s = status.toUpperCase();
            if (s.equals("STANDBY") || s.equals("IN_PROGRESS") || s.equals("COMPLETED") || s.equals("REPORT_READY") || s.equals("OFFICIAL") || s.equals("CANCELLED")) {
                throw new IllegalStateException("Cannot place or modify predictions when race is in status: " + status);
            }
        }

        // Enforce one guess per spectator per race at service layer (DB unique constraint also enforces it)
        if (!predictionRepository.findBySpectatorIdAndRaceId(prediction.getSpectatorId(), prediction.getRaceId()).isEmpty()) {
            throw new IllegalStateException("Spectator already placed a prediction for this race");
        }

        Prediction saved = predictionRepository.save(prediction);

        // create an in-app notification for the spectator
        try {
            Notification n = Notification.builder()
                    .userId(saved.getSpectatorId())
                    .type("PREDICTION_PLACED")
                    .channel("IN_APP")
                    .title("Prediction placed")
                    .message("Your guess for race '" + race.getName() + "' has been recorded.")
                    .deepLink("/races/" + race.getId())
                    .build();
            notificationRepository.save(n);
        } catch (Exception ex) {
            // non-fatal
        }

        return saved;
    }
}

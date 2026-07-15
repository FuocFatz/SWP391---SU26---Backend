package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RaceService;
import com.equix.horseracingsystem.service.RaceWorkflowService;
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
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/races")
@CrossOrigin("*")
@SuppressWarnings("null")
@Tag(name = "Races", description = "Race management, workflow, results, and leaderboards")
public class RaceController {

    private final RaceService raceService;
    private final RaceWorkflowService workflowService;
    private final RaceRegistrationRepository registrationRepository;
    private final RaceResultRepository resultRepository;
    private final RaceNoteRepository raceNoteRepository;
    private final PredictionRepository predictionRepository;

    public RaceController(
            RaceService raceService,
            RaceWorkflowService workflowService,
            RaceRegistrationRepository registrationRepository,
            RaceResultRepository resultRepository,
            RaceNoteRepository raceNoteRepository,
            PredictionRepository predictionRepository) {
        this.raceService = raceService;
        this.workflowService = workflowService;
        this.registrationRepository = registrationRepository;
        this.resultRepository = resultRepository;
        this.raceNoteRepository = raceNoteRepository;
        this.predictionRepository = predictionRepository;
    }

    @Operation(summary = "Get all races",
            description = "Retrieves races. Optionally filter by tournamentId, refereeId, or status.")
    @ApiResponse(responseCode = "200", description = "List of races",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceResponse.class))))
    @GetMapping
    public List<RaceResponse> getAll(
            @Parameter(description = "Filter by tournament ID") @RequestParam(required = false) Long tournamentId,
            @Parameter(description = "Filter by referee ID") @RequestParam(required = false) Long refereeId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        return raceService.getAllRaces(tournamentId, refereeId, status);
    }

    @Operation(summary = "Get race by ID", description = "Retrieves a single race by its ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race found",
                    content = @Content(schema = @Schema(implementation = RaceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @GetMapping("/{id}")
    public RaceResponse getById(@Parameter(description = "Race ID") @PathVariable Long id) {
        return raceService.getRaceById(id);
    }

    @Operation(summary = "Create a new race", description = "Creates a new race record")
    @ApiResponse(responseCode = "200", description = "Race created successfully",
            content = @Content(schema = @Schema(implementation = RaceResponse.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RaceResponse create(@jakarta.validation.Valid @RequestBody RaceRequest request) {
        return raceService.createRace(request);
    }

    @Operation(summary = "Update a race", description = "Updates an existing race by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race updated successfully",
                    content = @Content(schema = @Schema(implementation = RaceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RaceResponse update(@Parameter(description = "Race ID") @PathVariable Long id,
                       @RequestBody RaceRequest request) {
        return raceService.updateRace(id, request);
    }

    @Operation(summary = "Update race status", description = "Patches only the status field of a race")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated",
                    content = @Content(schema = @Schema(implementation = RaceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public RaceResponse updateStatus(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @Parameter(description = "New status value") @RequestParam String status) {
        return raceService.updateStatus(id, status);
    }

    @Operation(summary = "Get race registrations",
            description = "Retrieves all registrations for a specific race")
    @ApiResponse(responseCode = "200", description = "List of registrations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceRegistrationResponse.class))))
    @GetMapping("/{id}/registrations")
    public List<RaceRegistrationResponse> getRegistrations(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return registrationRepository.findByRaceId(id).stream()
                .map(reg -> RaceRegistrationResponse.builder()
                        .id(reg.getId())
                        .raceId(reg.getRace().getId())
                        .horseId(reg.getHorse().getId())
                        .jockeyId(reg.getJockey().getId())
                        .ownerId(reg.getOwner().getId())
                        .status(reg.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Operation(summary = "Start a race", description = "Transitions a race to IN_PROGRESS status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race started",
                    content = @Content(schema = @Schema(implementation = RaceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Race cannot be started", content = @Content)
    })
    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('ADMIN')")
    public RaceResponse startRace(@Parameter(description = "Race ID") @PathVariable Long id) {
        Race race = workflowService.startRace(id);
        return raceService.mapToResponse(race);
    }

    @Operation(summary = "Simulate a race",
            description = "Runs a simulation for the race, optionally for a given duration")
    @ApiResponse(responseCode = "200", description = "Simulation results")
    @GetMapping("/{id}/simulate")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> simulateRace(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @Parameter(description = "Simulation duration in seconds") @RequestParam(required = false) Integer durationSeconds) {
        return workflowService.simulateRace(id, durationSeconds);
    }

    @Operation(summary = "Get race results",
            description = "Retrieves final results for a completed race ordered by finish position")
    @ApiResponse(responseCode = "200", description = "List of race results",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceResult.class))))
    @GetMapping("/{id}/results")
    public List<RaceResult> getResults(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return resultRepository.findByRaceIdOrderByFinishPositionAsc(id);
    }

    @Operation(summary = "Get race notes",
            description = "Retrieves notes for a completed race")
    @ApiResponse(responseCode = "200", description = "List of race notes",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceNote.class))))
    @GetMapping("/{id}/notes")
    public List<RaceNote> getNotes(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return raceNoteRepository.findByRaceId(id);
    }

    @Operation(summary = "Get predictions for a race",
            description = "Retrieves all spectator predictions for a specific race")
    @ApiResponse(responseCode = "200", description = "List of predictions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PredictionResponse.class))))
    @GetMapping("/{id}/predictions")
    public List<PredictionResponse> getPredictions(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return predictionRepository.findByRaceId(id).stream()
                .map(p -> PredictionResponse.builder()
                        .id(p.getId())
                        .raceId(p.getRace().getId())
                        .spectatorId(p.getSpectator().getId())
                        .predictedHorseId(p.getPredictedHorse().getId())
                        .wagerPoints(p.getWagerPoints())
                        .status(p.getStatus() != null ? p.getStatus().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Operation(summary = "Create a prediction for a race",
            description = "Places a spectator prediction on a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction placed successfully",
                    content = @Content(schema = @Schema(implementation = PredictionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Prediction failed", content = @Content)
    })
    @PostMapping("/{id}/predictions")
    public PredictionResponse createPrediction(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody PredictionRequest request) {
        Prediction p = workflowService.createPrediction(id, request);
        return PredictionResponse.builder()
                        .id(p.getId())
                        .raceId(p.getRace().getId())
                        .spectatorId(p.getSpectator().getId())
                        .predictedHorseId(p.getPredictedHorse().getId())
                        .wagerPoints(p.getWagerPoints())
                        .status(p.getStatus() != null ? p.getStatus().name() : null)
                        .build();
    }

    @Operation(summary = "Horse leaderboard",
            description = "Retrieves the overall horse performance leaderboard")
    @ApiResponse(responseCode = "200", description = "Horse leaderboard data")
    @GetMapping("/leaderboard/horses")
    public List<Map<String, Object>> horseLeaderboard() {
        return workflowService.horseLeaderboard();
    }

    @Operation(summary = "Jockey leaderboard",
            description = "Retrieves the overall jockey performance leaderboard")
    @ApiResponse(responseCode = "200", description = "Jockey leaderboard data")
    @GetMapping("/leaderboard/jockeys")
    public List<Map<String, Object>> jockeyLeaderboard() {
        return workflowService.jockeyLeaderboard();
    }
}

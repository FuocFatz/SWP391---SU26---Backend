package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RaceWorkflowService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/races")
@CrossOrigin("*")
@SuppressWarnings("null")
@Tag(name = "Races", description = "Race management, workflow, results, and leaderboards")
public class RaceController {

    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final RaceResultRepository resultRepository;
    private final PredictionRepository predictionRepository;
    private final RaceWorkflowService workflowService;

    public RaceController(
            RaceRepository raceRepository,
            RaceRegistrationRepository registrationRepository,
            RaceResultRepository resultRepository,
            PredictionRepository predictionRepository,
            RaceWorkflowService workflowService) {
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.resultRepository = resultRepository;
        this.predictionRepository = predictionRepository;
        this.workflowService = workflowService;
    }

    @Operation(summary = "Get all races",
            description = "Retrieves races. Optionally filter by tournamentId, refereeId, or status.")
    @ApiResponse(responseCode = "200", description = "List of races",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Race.class))))
    @GetMapping
    public List<Race> getAll(
            @Parameter(description = "Filter by tournament ID") @RequestParam(required = false) Long tournamentId,
            @Parameter(description = "Filter by referee ID") @RequestParam(required = false) Long refereeId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        if (tournamentId != null) {
            return raceRepository.findByTournamentId(tournamentId);
        }
        if (refereeId != null) {
            return raceRepository.findByRefereeId(refereeId);
        }
        if (status != null && !status.isBlank()) {
            return raceRepository.findByStatus(status);
        }
        return raceRepository.findAll();
    }

    @Operation(summary = "Get race by ID", description = "Retrieves a single race by its ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race found",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @GetMapping("/{id}")
    public Race getById(@Parameter(description = "Race ID") @PathVariable Long id) {
        return raceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Race not found: " + id));
    }

    @Operation(summary = "Create a new race", description = "Creates a new race record")
    @ApiResponse(responseCode = "200", description = "Race created successfully",
            content = @Content(schema = @Schema(implementation = Race.class)))
    @PostMapping
    public Race create(@RequestBody Race race) {
        return raceRepository.save(race);
    }

    @Operation(summary = "Update a race", description = "Updates an existing race by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race updated successfully",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PutMapping("/{id}")
    public Race update(@Parameter(description = "Race ID") @PathVariable Long id,
                       @RequestBody Race race) {
        Race existing = getById(id);
        existing.setTournamentId(race.getTournamentId());
        existing.setName(race.getName());
        existing.setType(race.getType());
        existing.setDistanceM(race.getDistanceM());
        existing.setSurface(race.getSurface());
        existing.setRaceDate(race.getRaceDate());
        existing.setRaceTime(race.getRaceTime());
        existing.setMaxParticipants(race.getMaxParticipants());
        existing.setPrizePool(race.getPrizePool());
        existing.setRefereeId(race.getRefereeId());
        existing.setStatus(race.getStatus());
        return raceRepository.save(existing);
    }

    @Operation(summary = "Update race status", description = "Patches only the status field of a race")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PatchMapping("/{id}/status")
    public Race updateStatus(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @Parameter(description = "New status value") @RequestParam String status) {
        Race race = getById(id);
        race.setStatus(status);
        return raceRepository.save(race);
    }

    @Operation(summary = "Get race registrations",
            description = "Retrieves all registrations for a specific race")
    @ApiResponse(responseCode = "200", description = "List of registrations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceRegistration.class))))
    @GetMapping("/{id}/registrations")
    public List<RaceRegistration> getRegistrations(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return registrationRepository.findByRaceId(id);
    }

    @Operation(summary = "Register a horse for a race",
            description = "Registers a horse into a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse registered successfully",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration failed", content = @Content)
    })
    @PostMapping("/{id}/registrations")
    public RaceRegistration registerHorse(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody RaceRegistrationRequest request) {
        return workflowService.registerHorse(id, request);
    }

    @Operation(summary = "Start a race", description = "Transitions a race to IN_PROGRESS status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race started",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race cannot be started", content = @Content)
    })
    @PostMapping("/{id}/start")
    public Race startRace(@Parameter(description = "Race ID") @PathVariable Long id) {
        return workflowService.startRace(id);
    }

    @Operation(summary = "Simulate a race",
            description = "Runs a simulation for the race, optionally for a given duration")
    @ApiResponse(responseCode = "200", description = "Simulation results")
    @GetMapping("/{id}/simulate")
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

    @Operation(summary = "Confirm race results",
            description = "Referee confirms and records the official race results")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Results confirmed",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceResult.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid results data", content = @Content)
    })
    @PostMapping("/{id}/results")
    public List<RaceResult> confirmResults(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody ConfirmRaceResultsRequest request) {
        return workflowService.confirmResults(id, request);
    }

    @Operation(summary = "Get predictions for a race",
            description = "Retrieves all spectator predictions for a specific race")
    @ApiResponse(responseCode = "200", description = "List of predictions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Prediction.class))))
    @GetMapping("/{id}/predictions")
    public List<Prediction> getPredictions(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return predictionRepository.findByRaceId(id);
    }

    @Operation(summary = "Create a prediction for a race",
            description = "Places a spectator prediction on a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction placed successfully",
                    content = @Content(schema = @Schema(implementation = Prediction.class))),
            @ApiResponse(responseCode = "400", description = "Prediction failed", content = @Content)
    })
    @PostMapping("/{id}/predictions")
    public Prediction createPrediction(
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody PredictionRequest request) {
        return workflowService.createPrediction(id, request);
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

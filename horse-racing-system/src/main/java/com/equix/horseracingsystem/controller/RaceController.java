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
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.security.Principal;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/races")
@CrossOrigin("*")
@SuppressWarnings("null")
@Tag(name = "Races", description = "Race management, workflow, results, and leaderboards")
public class RaceController {

    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final RaceResultRepository resultRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final RaceWorkflowService workflowService;

    public RaceController(
            RaceRepository raceRepository,
            RaceRegistrationRepository registrationRepository,
            RaceResultRepository resultRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            RaceWorkflowService workflowService) {
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.resultRepository = resultRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
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
            return raceRepository.findByTournamentIdAndDeletedAtIsNull(tournamentId);
        }
        if (refereeId != null) {
            return raceRepository.findByRefereeIdAndDeletedAtIsNull(refereeId);
        }
        if (status != null && !status.isBlank()) {
            return raceRepository.findByStatusAndDeletedAtIsNull(status);
        }
        return raceRepository.findByDeletedAtIsNull();
    }

    @Operation(summary = "Get race by ID", description = "Retrieves a single race by its ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race found",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @GetMapping("/{id}")
    public Race getById(@Parameter(description = "Race ID") @PathVariable Long id) {
        return raceRepository.findById(id).filter(race -> race.getDeletedAt() == null)
                .orElseThrow(() -> new RuntimeException("Race not found: " + id));
    }

    @Operation(summary = "Create a new race", description = "Creates a new race record")
    @ApiResponse(responseCode = "200", description = "Race created successfully",
            content = @Content(schema = @Schema(implementation = Race.class)))
    @PostMapping
    public Race create(Principal principal, @RequestBody Race race) {
        return workflowService.createRace(principal.getName(), race);
    }

    @Operation(summary = "Update a race", description = "Updates an existing race by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race updated successfully",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PutMapping("/{id}")
    public Race update(Principal principal, @Parameter(description = "Race ID") @PathVariable Long id,
                       @RequestBody Race race) {
        return workflowService.updateRace(principal.getName(), id, race);
    }

    @Operation(summary = "Delete a race",
            description = "Soft-deletes an empty pre-start race. Races with participant or result activity must be cancelled instead.")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Principal principal, @Parameter(description = "Race ID") @PathVariable Long id) {
        workflowService.deleteRace(principal.getName(), id);
    }

    @Operation(summary = "Update race status", description = "Patches only the status field of a race")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race not found", content = @Content)
    })
    @PatchMapping("/{id}/status")
    public Race updateStatus(Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id,
            @Parameter(description = "New status value") @RequestParam String status) {
        return workflowService.adminUpdateStatus(principal.getName(), id, status);
    }

    @Operation(summary = "Cancel a race", description = "Cancels a pre-start race and voids its entries and guesses")
    @PostMapping("/{id}/cancel")
    public Race cancelRace(Principal principal, @PathVariable Long id,
                           @Valid @RequestBody CancelRaceRequest request) {
        return workflowService.cancelRace(principal.getName(), id, request);
    }

    @Operation(summary = "Reschedule a race", description = "Moves a pre-start race to a new date and time")
    @PostMapping("/{id}/reschedule")
    public Race rescheduleRace(Principal principal, @PathVariable Long id,
                               @Valid @RequestBody RescheduleRaceRequest request) {
        return workflowService.rescheduleRace(principal.getName(), id, request);
    }

    @PostMapping("/{id}/referee")
    public Race reassignReferee(Principal principal, @PathVariable Long id,
                                @Valid @RequestBody ReassignRefereeRequest request) {
        return workflowService.reassignReferee(principal.getName(), id, request);
    }

    @Operation(summary = "Get race registrations",
            description = "Retrieves all registrations for a specific race")
    @ApiResponse(responseCode = "200", description = "List of registrations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceEntryResponse.class))))
    @GetMapping("/{id}/registrations")
    public List<RaceEntryResponse> getRegistrations(
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return registrationRepository.findByRaceId(id).stream()
                .filter(registration -> registration.getDeletedAt() == null)
                .filter(registration -> List.of("READY_FOR_CHECK", "APPROVED", "CLEARED_TO_RACE", "DNF")
                        .contains(registration.getStatus()))
                .map(registration -> RaceEntryResponse.from(
                        registration,
                        horseName(registration.getHorseId()),
                        horseImageUrl(registration.getHorseId()),
                        userName(registration.getOwnerId(), "Unknown owner"),
                        userName(registration.getJockeyId(), "Unassigned jockey")))
                .toList();
    }

    @Operation(summary = "Register a horse for a race",
            description = "Registers a horse into a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse registered successfully",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration failed", content = @Content)
    })
    @PostMapping("/{id}/registrations")
    public RaceRegistration registerHorse(Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody RaceRegistrationRequest request) {
        return workflowService.registerHorse(principal.getName(), id, request);
    }

    @Operation(summary = "Start a race", description = "Transitions a race to IN_PROGRESS status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Race started",
                    content = @Content(schema = @Schema(implementation = Race.class))),
            @ApiResponse(responseCode = "400", description = "Race cannot be started", content = @Content)
    })
    @PostMapping("/{id}/start")
    public Race startRace(Principal principal, @Parameter(description = "Race ID") @PathVariable Long id) {
        return workflowService.startRace(principal.getName(), id);
    }

    @PostMapping("/{id}/complete")
    public Race completeRace(Principal principal, @PathVariable Long id) {
        return workflowService.completeRace(principal.getName(), id);
    }

    @PostMapping("/{id}/prepare")
    public Race prepareRace(Principal principal, @PathVariable Long id) {
        return workflowService.prepareRace(principal.getName(), id);
    }

    @PostMapping("/{id}/report")
    public RaceNote submitReport(Principal principal, @PathVariable Long id,
                                 @Valid @RequestBody RaceReportRequest request) {
        return workflowService.submitRaceReport(principal.getName(), id, request);
    }

    @PostMapping("/{id}/incidents")
    public RaceNote addIncident(Principal principal, @PathVariable Long id,
                                @Valid @RequestBody RaceIncidentNoteRequest request) {
        return workflowService.addRaceIncident(principal.getName(), id, request);
    }

    @GetMapping("/{id}/notes")
    public List<RaceNote> getRaceNotes(Principal principal, @PathVariable Long id) {
        return workflowService.raceNotesFor(principal.getName(), id);
    }

    @PostMapping("/{id}/report/revision")
    public Race requestReportRevision(Principal principal, @PathVariable Long id,
                                      @Valid @RequestBody AdminReportRevisionRequest request) {
        return workflowService.requestReportRevision(principal.getName(), id, request);
    }

    @Operation(summary = "Simulate a race",
            description = "Runs a simulation for the race, optionally for a given duration")
    @ApiResponse(responseCode = "200", description = "Simulation results")
    @GetMapping("/{id}/simulate")
    public Map<String, Object> simulateRace(
            Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id,
            @Parameter(description = "Simulation duration in seconds") @RequestParam(required = false) Integer durationSeconds) {
        return workflowService.simulateRaceForReferee(principal.getName(), id, durationSeconds);
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
    public List<RaceResult> confirmResults(Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody ConfirmRaceResultsRequest request) {
        return workflowService.confirmResults(principal.getName(), id, request);
    }

    @Operation(summary = "Get predictions for a race",
            description = "Retrieves all spectator predictions for a specific race")
    @ApiResponse(responseCode = "200", description = "List of predictions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Prediction.class))))
    @GetMapping("/{id}/predictions")
    public List<Prediction> getPredictions(Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id) {
        return workflowService.predictionsFor(principal.getName(), id);
    }

    @Operation(summary = "Create a prediction for a race",
            description = "Places a spectator prediction on a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction placed successfully",
                    content = @Content(schema = @Schema(implementation = Prediction.class))),
            @ApiResponse(responseCode = "400", description = "Prediction failed", content = @Content)
    })
    @PostMapping("/{id}/predictions")
    public Prediction createPrediction(Principal principal,
            @Parameter(description = "Race ID") @PathVariable Long id,
            @RequestBody PredictionRequest request) {
        return workflowService.createPrediction(principal.getName(), id, request);
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

    private String horseName(Long horseId) {
        if (horseId == null) return "Unknown horse";
        return horseRepository.findById(horseId).map(Horse::getHorseName).orElse("Horse #" + horseId);
    }

    private String horseImageUrl(Long horseId) {
        if (horseId == null) return null;
        return horseRepository.findById(horseId).map(Horse::getImageUrl).orElse(null);
    }

    private String userName(Long userId, String fallback) {
        if (userId == null) return fallback;
        return userRepository.findById(userId).map(User::getFullName).orElse(fallback);
    }
}

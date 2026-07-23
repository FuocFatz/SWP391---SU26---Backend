package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.TournamentRepository;
import com.equix.horseracingsystem.service.TournamentStandingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin("*")
@SuppressWarnings("null")
@Tag(name = "Tournaments", description = "Tournament management operations")
public class TournamentController {

    private static final Set<String> TOURNAMENT_STATUSES = Set.of(
            "DRAFT", "OPEN", "CLOSED", "ONGOING", "COMPLETED", "CANCELLED");

    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final TournamentStandingService standingService;

    public TournamentController(TournamentRepository tournamentRepository,
                                RaceRepository raceRepository,
                                RaceRegistrationRepository registrationRepository,
                                TournamentStandingService standingService) {
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.standingService = standingService;
    }

    @Operation(summary = "Get all tournaments", description = "Retrieves a list of all tournaments")
    @ApiResponse(responseCode = "200", description = "List of tournaments",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Tournament.class))))
    @GetMapping
    public List<Tournament> getAll() {
        return tournamentRepository.findByDeletedAtIsNull();
    }

    @Operation(summary = "Get tournament by ID", description = "Retrieves a tournament by its unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tournament found",
                    content = @Content(schema = @Schema(implementation = Tournament.class))),
            @ApiResponse(responseCode = "400", description = "Tournament not found", content = @Content)
    })
    @GetMapping("/{id}")
    public Tournament getById(
            @Parameter(description = "Tournament ID") @PathVariable Long id) {
        return tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament not found: " + id));
    }

    @Operation(summary = "Get tournament standings", description = "Aggregates official race points and tie-breakers")
    @GetMapping("/{id}/standings")
    public List<Map<String, Object>> standings(@PathVariable Long id) {
        return standingService.standings(id);
    }

    @Operation(summary = "Create a tournament", description = "Creates a new tournament")
    @ApiResponse(responseCode = "200", description = "Tournament created",
            content = @Content(schema = @Schema(implementation = Tournament.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Tournament create(@RequestBody Tournament tournament) {
        validateTournament(tournament);
        tournament.setId(null);
        tournament.setDeletedAt(null);
        return tournamentRepository.save(tournament);
    }

    @Operation(summary = "Update a tournament", description = "Updates an existing tournament by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tournament updated",
                    content = @Content(schema = @Schema(implementation = Tournament.class))),
            @ApiResponse(responseCode = "400", description = "Tournament not found", content = @Content)
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Tournament update(
            @Parameter(description = "Tournament ID") @PathVariable Long id,
            @RequestBody Tournament tournament) {
        Tournament existing = getById(id);
        existing.setName(tournament.getName());
        existing.setDescription(tournament.getDescription());
        existing.setLocation(tournament.getLocation());
        existing.setStartDate(tournament.getStartDate());
        existing.setEndDate(tournament.getEndDate());
        existing.setStatus(tournament.getStatus());
        existing.setGracePeriodHours(tournament.getGracePeriodHours());
        validateTournament(existing);
        return tournamentRepository.save(existing);
    }

    @Operation(summary = "Delete a tournament", description = "Soft-deletes a tournament and draft/cancelled races when no active registration exists")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Tournament tournament = getById(id);
        List<Race> races = raceRepository.findByTournamentIdAndDeletedAtIsNull(id);
        boolean hasLockedRace = races.stream()
                .anyMatch(race -> !Set.of("DRAFT", "CANCELLED").contains(normalize(race.getStatus())));
        if (hasLockedRace) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only tournaments whose races are Draft or Cancelled can be deleted");
        }
        boolean hasActiveRegistration = races.stream().anyMatch(race -> registrationRepository.findByRaceId(race.getId()).stream()
                .anyMatch(entry -> entry.getDeletedAt() == null
                        && !Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE")
                        .contains(normalize(entry.getStatus()))));
        if (hasActiveRegistration) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Withdraw or cancel all active race registrations before deleting this tournament");
        }
        LocalDateTime deletedAt = LocalDateTime.now();
        races.forEach(race -> race.setDeletedAt(deletedAt));
        raceRepository.saveAll(races);
        tournament.setDeletedAt(deletedAt);
        tournamentRepository.save(tournament);
    }

    private void validateTournament(Tournament tournament) {
        if (tournament.getName() == null || tournament.getName().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tournament name is required");
        }
        if (tournament.getStartDate() == null || tournament.getEndDate() == null
                || tournament.getEndDate().isBefore(tournament.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tournament start and end dates are invalid");
        }
        int graceHours = tournament.getGracePeriodHours() == null ? 120 : tournament.getGracePeriodHours();
        if (!List.of(72, 120, 168).contains(graceHours)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Grace period must be 72, 120, or 168 hours");
        }
        String status = normalize(tournament.getStatus());
        if (status.isBlank()) status = "OPEN";
        if (!TOURNAMENT_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tournament status must be Draft, Open, Closed, Ongoing, Completed, or Cancelled");
        }
        tournament.setGracePeriodHours(graceHours);
        tournament.setStatus(status);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(java.util.Locale.ROOT);
    }
}

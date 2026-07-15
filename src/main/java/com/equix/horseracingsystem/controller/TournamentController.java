package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.TournamentRequest;
import com.equix.horseracingsystem.dto.TournamentResponse;
import com.equix.horseracingsystem.dto.RaceResponse;
import com.equix.horseracingsystem.service.TournamentService;
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
@RequestMapping("/api/v1/tournaments")
@CrossOrigin("*")
@Tag(name = "Tournaments", description = "Tournament management operations")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @Operation(summary = "Get all tournaments", description = "Retrieves a list of all tournaments")
    @ApiResponse(responseCode = "200", description = "List of tournaments",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = TournamentResponse.class))))
    @GetMapping
    public List<TournamentResponse> getAll() {
        return tournamentService.getAllTournaments();
    }

    @Operation(summary = "Get tournament by ID", description = "Retrieves a tournament by its unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tournament found",
                    content = @Content(schema = @Schema(implementation = TournamentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Tournament not found", content = @Content)
    })
    @GetMapping("/{id}")
    public TournamentResponse getById(
            @Parameter(description = "Tournament ID") @PathVariable Long id) {
        return tournamentService.getTournamentById(id);
    }

    @Operation(summary = "Create a tournament", description = "Creates a new tournament")
    @ApiResponse(responseCode = "200", description = "Tournament created",
            content = @Content(schema = @Schema(implementation = TournamentResponse.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public TournamentResponse create(@RequestBody TournamentRequest request) {
        return tournamentService.createTournament(request);
    }

    @GetMapping("/{tournamentId}/races")
    public List<RaceResponse> getRaces(@PathVariable Long tournamentId) {
        return tournamentService.getRacesByTournamentId(tournamentId);
    }

    @Operation(summary = "Update a tournament", description = "Updates an existing tournament by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tournament updated",
                    content = @Content(schema = @Schema(implementation = TournamentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Tournament not found", content = @Content)
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TournamentResponse update(
            @Parameter(description = "Tournament ID") @PathVariable Long id,
            @RequestBody TournamentRequest request) {
        return tournamentService.updateTournament(id, request);
    }
}

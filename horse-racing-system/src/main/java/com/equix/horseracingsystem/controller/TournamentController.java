package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.repository.TournamentRepository;
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
@RequestMapping("/api/tournaments")
@CrossOrigin("*")
@SuppressWarnings("null")
@Tag(name = "Tournaments", description = "Tournament management operations")
public class TournamentController {

    private final TournamentRepository tournamentRepository;

    public TournamentController(TournamentRepository tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }

    @Operation(summary = "Get all tournaments", description = "Retrieves a list of all tournaments")
    @ApiResponse(responseCode = "200", description = "List of tournaments",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Tournament.class))))
    @GetMapping
    public List<Tournament> getAll() {
        return tournamentRepository.findAll();
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
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
    }

    @Operation(summary = "Create a tournament", description = "Creates a new tournament")
    @ApiResponse(responseCode = "200", description = "Tournament created",
            content = @Content(schema = @Schema(implementation = Tournament.class)))
    @PostMapping
    public Tournament create(@RequestBody Tournament tournament) {
        return tournamentRepository.save(tournament);
    }

    @Operation(summary = "Update a tournament", description = "Updates an existing tournament by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tournament updated",
                    content = @Content(schema = @Schema(implementation = Tournament.class))),
            @ApiResponse(responseCode = "400", description = "Tournament not found", content = @Content)
    })
    @PutMapping("/{id}")
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
        return tournamentRepository.save(existing);
    }
}

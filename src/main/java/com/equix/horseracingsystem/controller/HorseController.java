package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.service.HorseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horses")
@CrossOrigin("*")
@Tag(name = "Horses", description = "Horse management operations")
public class HorseController {

    private final HorseService service;

    public HorseController(HorseService service) {
        this.service = service;
    }

    @Operation(summary = "Get all horses", description = "Retrieves a list of all registered horses")
    @ApiResponse(responseCode = "200", description = "List of horses retrieved",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Horse.class))))
    @GetMapping
    public List<Horse> getAll() {
        return service.getAll();
    }

    @Operation(summary = "Get horses by owner", description = "Retrieves all horses belonging to a specific owner")
    @ApiResponse(responseCode = "200", description = "List of owner's horses",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Horse.class))))
    @GetMapping("/owner/{ownerId}")
    public List<Horse> getByOwner(
            @Parameter(description = "Owner user ID") @PathVariable @NonNull Long ownerId) {
        return service.getByOwner(ownerId);
    }

    @Operation(summary = "Get horse by ID", description = "Retrieves a horse by its unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse found",
                    content = @Content(schema = @Schema(implementation = Horse.class))),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @GetMapping("/{id}")
    public Horse getById(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id) {
        return service.getById(id);
    }

    @Operation(summary = "Register a new horse", description = "Creates a new horse record")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse created successfully",
                    content = @Content(schema = @Schema(implementation = Horse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content)
    })
    @PostMapping
    public Horse create(@RequestBody @NonNull Horse horse) {
        return service.create(horse);
    }

    @Operation(summary = "Update a horse", description = "Updates an existing horse by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse updated successfully",
                    content = @Content(schema = @Schema(implementation = Horse.class))),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @PutMapping("/{id}")
    public Horse update(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id,
            @RequestBody Horse horse) {
        return service.update(id, horse);
    }

    @Operation(summary = "Delete a horse", description = "Deletes a horse by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public String delete(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id) {
        service.delete(id);
        return "Deleted horse id: " + id;
    }
}

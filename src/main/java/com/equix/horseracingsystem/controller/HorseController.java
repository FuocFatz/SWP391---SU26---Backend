package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.HorseResponse;
import com.equix.horseracingsystem.dto.HorseCreateRequest;
import com.equix.horseracingsystem.dto.HorseUpdateRequest;
import com.equix.horseracingsystem.service.HorseService;
import com.equix.horseracingsystem.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/horses")
@CrossOrigin("*")
@Tag(name = "Horses", description = "Horse management operations")
@SuppressWarnings("null")
public class HorseController {

    private final HorseService horseService;
    private final SecurityUtil securityUtil;

    public HorseController(HorseService horseService, SecurityUtil securityUtil) {
        this.horseService = horseService;
        this.securityUtil = securityUtil;
    }

    @Operation(summary = "Get all horses", description = "Retrieves a list of all registered horses")
    @ApiResponse(responseCode = "200", description = "List of horses retrieved",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = HorseResponse.class))))
    @GetMapping
    public List<HorseResponse> getAll() {
        return horseService.getAll();
    }

    @Operation(summary = "Get my horses", description = "Retrieves horses owned by the current user")
    @ApiResponse(responseCode = "200", description = "List of horses",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = HorseResponse.class))))
    @GetMapping("/my-horses")
    @PreAuthorize("hasRole('HORSE_OWNER')")
    public List<HorseResponse> getMyHorses() {
        return horseService.getByOwner(securityUtil.getCurrentUserId());
    }

    @Operation(summary = "Get horse by ID", description = "Retrieves a horse by its unique ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse found",
                    content = @Content(schema = @Schema(implementation = HorseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @GetMapping("/{id}")
    public HorseResponse getById(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id) {
        return horseService.getById(id);
    }

    @Operation(summary = "Register a new horse", description = "Creates a new horse record")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse created successfully",
                    content = @Content(schema = @Schema(implementation = HorseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content)
    })
    @PostMapping
    @PreAuthorize("hasRole('HORSE_OWNER') or hasRole('ADMIN')")
    public HorseResponse create(@Valid @RequestBody @NonNull HorseCreateRequest request) {
        return horseService.create(request);
    }

    @Operation(summary = "Update a horse", description = "Updates an existing horse by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse updated successfully",
                    content = @Content(schema = @Schema(implementation = HorseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HORSE_OWNER') or hasRole('ADMIN')")
    public HorseResponse update(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id,
            @Valid @RequestBody @NonNull HorseUpdateRequest request) {
        return horseService.update(id, request);
    }

    @Operation(summary = "Delete a horse", description = "Deletes a horse by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Horse not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HORSE_OWNER') or hasRole('ADMIN')")
    public String delete(
            @Parameter(description = "Horse ID") @PathVariable @NonNull Long id) {
        horseService.delete(id);
        return "Deleted horse id: " + id;
    }
}

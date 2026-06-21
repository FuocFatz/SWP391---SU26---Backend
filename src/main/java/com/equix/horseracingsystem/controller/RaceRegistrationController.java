package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.RefereeCheckRequest;
import com.equix.horseracingsystem.entity.RaceRegistration;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
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
@RequestMapping("/api/registrations")
@CrossOrigin("*")
@Tag(name = "Race Registrations", description = "Registration workflow — approve, confirm, withdraw, referee check")
public class RaceRegistrationController {

    private final RaceRegistrationRepository registrationRepository;
    private final RaceWorkflowService workflowService;

    public RaceRegistrationController(
            RaceRegistrationRepository registrationRepository,
            RaceWorkflowService workflowService) {
        this.registrationRepository = registrationRepository;
        this.workflowService = workflowService;
    }

    @Operation(summary = "Get all registrations",
            description = "Retrieves registrations. Optionally filter by ownerId, jockeyId, or status.")
    @ApiResponse(responseCode = "200", description = "List of registrations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceRegistration.class))))
    @GetMapping
    public List<RaceRegistration> getAll(
            @Parameter(description = "Filter by owner ID") @RequestParam(required = false) Long ownerId,
            @Parameter(description = "Filter by jockey ID") @RequestParam(required = false) Long jockeyId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        if (ownerId != null) {
            return registrationRepository.findByOwnerId(ownerId);
        }
        if (jockeyId != null) {
            return registrationRepository.findByJockeyId(jockeyId);
        }
        if (status != null && !status.isBlank()) {
            return registrationRepository.findByStatus(status);
        }
        return registrationRepository.findAll();
    }

    @Operation(summary = "Approve a registration",
            description = "Approves a pending race registration")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration approved",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found or cannot be approved",
                    content = @Content)
    })
    @PatchMapping("/{id}/approve")
    public RaceRegistration approve(
            @Parameter(description = "Registration ID") @PathVariable Long id) {
        return workflowService.approveRegistration(id);
    }

    @Operation(summary = "Owner confirms registration",
            description = "Owner confirms their horse registration for a race")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration confirmed by owner",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PatchMapping("/{id}/owner-confirm")
    public RaceRegistration ownerConfirm(
            @Parameter(description = "Registration ID") @PathVariable Long id) {
        return workflowService.ownerConfirm(id);
    }

    @Operation(summary = "Withdraw a registration",
            description = "Withdraws a horse from a race with an optional reason")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration withdrawn",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PatchMapping("/{id}/withdraw")
    public RaceRegistration withdraw(
            @Parameter(description = "Registration ID") @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "Withdrawn" : body.getOrDefault("reason", "Withdrawn");
        return workflowService.withdrawRegistration(id, reason);
    }

    @Operation(summary = "Referee health check",
            description = "Referee performs a health check on a registration entry")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Health check recorded",
                    content = @Content(schema = @Schema(implementation = RaceRegistration.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PatchMapping("/{id}/referee-check")
    public RaceRegistration refereeCheck(
            @Parameter(description = "Registration ID") @PathVariable Long id,
            @RequestBody RefereeCheckRequest request) {
        return workflowService.refereeCheck(id, request);
    }
}

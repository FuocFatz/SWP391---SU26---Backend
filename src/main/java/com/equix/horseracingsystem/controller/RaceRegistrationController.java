package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.RaceRegistrationRequest;
import com.equix.horseracingsystem.dto.RaceRegistrationResponse;
import com.equix.horseracingsystem.dto.RefereeCheckRequest;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/race-registrations")
@CrossOrigin("*")
@Tag(name = "Race Registrations", description = "Registration workflow")
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
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RaceRegistrationResponse.class))))
    @GetMapping
    public List<RaceRegistrationResponse> getAll(
            @Parameter(description = "Filter by owner ID") @RequestParam(required = false) Long ownerId,
            @Parameter(description = "Filter by jockey ID") @RequestParam(required = false) Long jockeyId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        if (ownerId != null) {
            return registrationRepository.findByOwnerId(ownerId).stream().map(workflowService::mapRegistrationToResponse).collect(Collectors.toList());
        }
        if (jockeyId != null) {
            return registrationRepository.findByJockeyId(jockeyId).stream().map(workflowService::mapRegistrationToResponse).collect(Collectors.toList());
        }
        if (status != null && !status.isBlank()) {
            return registrationRepository.findByStatus(com.equix.horseracingsystem.enums.RegistrationStatus.valueOf(status.toUpperCase())).stream().map(workflowService::mapRegistrationToResponse).collect(Collectors.toList());
        }
        return registrationRepository.findAll().stream().map(workflowService::mapRegistrationToResponse).collect(Collectors.toList());
    }

    @Operation(summary = "Register a horse for a race",
            description = "Registers a horse into a race via the race workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Horse registered successfully",
                    content = @Content(schema = @Schema(implementation = RaceRegistrationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration failed", content = @Content)
    })
    @PostMapping
    @PreAuthorize("hasRole('HORSE_OWNER')")
    public RaceRegistrationResponse registerHorse(
            @RequestBody RaceRegistrationRequest request) {
        return workflowService.registerHorse(request.getRaceId(), request);
    }

    @Operation(summary = "Referee reviews a registration",
            description = "Trọng tài chấm điểm sức khỏe và duyệt hồ sơ đua")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration reviewed",
                    content = @Content(schema = @Schema(implementation = RaceRegistrationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found or cannot be reviewed",
                    content = @Content)
    })
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('REFEREE')")
    public RaceRegistrationResponse review(
            @Parameter(description = "Registration ID") @PathVariable Long id,
            @RequestBody RefereeCheckRequest request) {
        return workflowService.mapRegistrationToResponse(workflowService.refereeCheck(id, request));
    }

    @Operation(summary = "Owner confirms registration",
            description = "Owner confirms their horse registration for a race")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration confirmed by owner",
                    content = @Content(schema = @Schema(implementation = RaceRegistrationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PutMapping("/{id}/owner-confirm")
    @PreAuthorize("hasRole('HORSE_OWNER')")
    public RaceRegistrationResponse ownerConfirm(
            @Parameter(description = "Registration ID") @PathVariable Long id) {
        return workflowService.mapRegistrationToResponse(workflowService.ownerConfirm(id));
    }

    @Operation(summary = "Withdraw a registration",
            description = "Withdraws a horse from a race with an optional reason")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration withdrawn",
                    content = @Content(schema = @Schema(implementation = RaceRegistrationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PutMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('HORSE_OWNER') or hasRole('ADMIN')")
    public RaceRegistrationResponse withdraw(
            @Parameter(description = "Registration ID") @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "Withdrawn" : body.getOrDefault("reason", "Withdrawn");
        return workflowService.mapRegistrationToResponse(workflowService.withdrawRegistration(id, reason));
    }

    @Operation(summary = "Admin approves registration",
            description = "Admin approves a race registration")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registration approved",
                    content = @Content(schema = @Schema(implementation = RaceRegistrationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration not found", content = @Content)
    })
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public RaceRegistrationResponse approve(
            @Parameter(description = "Registration ID") @PathVariable Long id) {
        return workflowService.mapRegistrationToResponse(workflowService.approveRegistration(id));
    }
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.InvitationDecisionRequest;
import com.equix.horseracingsystem.dto.InvitationRequest;
import com.equix.horseracingsystem.entity.JockeyInvitation;
import com.equix.horseracingsystem.repository.JockeyInvitationRepository;
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

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin("*")
@Tag(name = "Jockey Invitations", description = "Owner-to-jockey invitation workflow")
public class JockeyInvitationController {

    private final JockeyInvitationRepository invitationRepository;
    private final RaceWorkflowService workflowService;

    public JockeyInvitationController(
            JockeyInvitationRepository invitationRepository,
            RaceWorkflowService workflowService) {
        this.invitationRepository = invitationRepository;
        this.workflowService = workflowService;
    }

    @Operation(summary = "Get all invitations",
            description = "Retrieves invitations. Optionally filter by jockeyId, ownerId, or raceId.")
    @ApiResponse(responseCode = "200", description = "List of invitations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = JockeyInvitation.class))))
    @GetMapping
    public List<JockeyInvitation> getAll(
            @Parameter(description = "Filter by jockey user ID") @RequestParam(required = false) Long jockeyId,
            @Parameter(description = "Filter by owner user ID") @RequestParam(required = false) Long ownerId,
            @Parameter(description = "Filter by race ID") @RequestParam(required = false) Long raceId) {
        if (jockeyId != null) {
            return invitationRepository.findByJockeyId(jockeyId);
        }
        if (ownerId != null) {
            return invitationRepository.findByOwnerId(ownerId);
        }
        if (raceId != null) {
            return invitationRepository.findByRaceId(raceId);
        }
        return invitationRepository.findAll();
    }

    @Operation(summary = "Send a jockey invitation",
            description = "Owner sends an invitation to a jockey for a specific race and horse")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invitation sent",
                    content = @Content(schema = @Schema(implementation = JockeyInvitation.class))),
            @ApiResponse(responseCode = "400", description = "Invalid invitation data", content = @Content)
    })
    @PostMapping
    public JockeyInvitation create(@RequestBody InvitationRequest request) {
        return workflowService.inviteJockey(request);
    }

    @Operation(summary = "Respond to an invitation",
            description = "Jockey accepts or declines an invitation")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Response recorded",
                    content = @Content(schema = @Schema(implementation = JockeyInvitation.class))),
            @ApiResponse(responseCode = "400", description = "Invitation not found or invalid response",
                    content = @Content)
    })
    @PatchMapping("/{id}/respond")
    public JockeyInvitation respond(
            @Parameter(description = "Invitation ID") @PathVariable Long id,
            @RequestBody InvitationDecisionRequest request) {
        return workflowService.respondToInvitation(id, request);
    }
}

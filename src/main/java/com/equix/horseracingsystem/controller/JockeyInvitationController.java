package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.InvitationDecisionRequest;
import com.equix.horseracingsystem.dto.InvitationRequest;
import com.equix.horseracingsystem.dto.JockeyInvitationResponse;
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
import com.equix.horseracingsystem.util.SecurityUtil;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jockey-invitations")
@CrossOrigin("*")
@Tag(name = "Jockey Invitations", description = "Owner-to-jockey invitation workflow")
public class JockeyInvitationController {

    private final JockeyInvitationRepository invitationRepository;
    private final RaceWorkflowService workflowService;
    private final SecurityUtil securityUtil;

    public JockeyInvitationController(
            JockeyInvitationRepository invitationRepository,
            RaceWorkflowService workflowService,
            SecurityUtil securityUtil) {
        this.invitationRepository = invitationRepository;
        this.workflowService = workflowService;
        this.securityUtil = securityUtil;
    }

    @Operation(summary = "Get all invitations",
            description = "Retrieves invitations. Optionally filter by jockeyId, ownerId, or raceId.")
    @ApiResponse(responseCode = "200", description = "List of invitations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = JockeyInvitationResponse.class))))
    @GetMapping
    public List<JockeyInvitationResponse> getAll(
            @Parameter(description = "Filter by jockey user ID") @RequestParam(required = false) Long jockeyId,
            @Parameter(description = "Filter by owner user ID") @RequestParam(required = false) Long ownerId,
            @Parameter(description = "Filter by race ID") @RequestParam(required = false) Long raceId) {
        if (jockeyId != null) {
            return invitationRepository.findByJockeyId(jockeyId).stream().map(workflowService::mapInvitationToResponse).toList();
        }
        if (ownerId != null) {
            return invitationRepository.findByOwnerId(ownerId).stream().map(workflowService::mapInvitationToResponse).toList();
        }
        if (raceId != null) {
            return invitationRepository.findByRaceId(raceId).stream().map(workflowService::mapInvitationToResponse).toList();
        }
        return invitationRepository.findAll().stream().map(workflowService::mapInvitationToResponse).toList();
    }

    @GetMapping("/my-invitations")
    public List<JockeyInvitationResponse> getMyInvitations() {
        Long currentUserId = securityUtil.getCurrentUserId();
        // Since a user can be either a jockey or an owner, we might just query both for now.
        // The repository might need to support OR, but we can combine.
        List<JockeyInvitation> asJockey = invitationRepository.findByJockeyId(currentUserId);
        List<JockeyInvitation> asOwner = invitationRepository.findByOwnerId(currentUserId);
        asJockey.addAll(asOwner);
        return asJockey.stream().distinct().map(workflowService::mapInvitationToResponse).toList();
    }

    @Operation(summary = "Send a jockey invitation",
            description = "Owner sends an invitation to a jockey for a specific race and horse")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invitation sent",
                    content = @Content(schema = @Schema(implementation = JockeyInvitationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid invitation data", content = @Content)
    })
    @PostMapping
    @PreAuthorize("hasRole('HORSE_OWNER')")
    public JockeyInvitationResponse create(@RequestBody InvitationRequest request) {
        return workflowService.inviteJockey(request);
    }

    @Operation(summary = "Respond to an invitation",
            description = "Jockey accepts or declines an invitation")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Response recorded",
                    content = @Content(schema = @Schema(implementation = JockeyInvitationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invitation not found or invalid response",
                    content = @Content)
    })
    @PutMapping("/{id}/respond")
    @PreAuthorize("hasRole('JOCKEY')")
    public JockeyInvitationResponse respond(
            @Parameter(description = "Invitation ID") @PathVariable Long id,
            @RequestBody InvitationDecisionRequest request) {
        return workflowService.respondToInvitation(id, request);
    }
}

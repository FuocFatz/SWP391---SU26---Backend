package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.InvitationDecisionRequest;
import com.equix.horseracingsystem.dto.InvitationRequest;
import com.equix.horseracingsystem.entity.JockeyInvitation;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class JockeyInvitationController {
    private final RaceWorkflowService workflowService;

    public JockeyInvitationController(RaceWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<JockeyInvitation> getMine(Principal principal, @RequestParam(required = false) Long raceId) {
        return workflowService.invitationsFor(principal.getName(), raceId);
    }

    @PostMapping
    public JockeyInvitation create(Principal principal, @RequestBody InvitationRequest request) {
        return workflowService.inviteJockey(principal.getName(), request);
    }

    @PatchMapping("/{id}/respond")
    public JockeyInvitation respond(Principal principal, @PathVariable Long id,
                                     @RequestBody InvitationDecisionRequest request) {
        return workflowService.respondToInvitation(principal.getName(), id, request);
    }
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.InvitationDecisionRequest;
import com.equix.horseracingsystem.dto.InvitationRequest;
import com.equix.horseracingsystem.entity.JockeyInvitation;
import com.equix.horseracingsystem.repository.JockeyInvitationRepository;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin("*")
public class JockeyInvitationController {

    private final JockeyInvitationRepository invitationRepository;
    private final RaceWorkflowService workflowService;

    public JockeyInvitationController(
            JockeyInvitationRepository invitationRepository,
            RaceWorkflowService workflowService) {
        this.invitationRepository = invitationRepository;
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<JockeyInvitation> getAll(@RequestParam(required = false) Long jockeyId,
                                         @RequestParam(required = false) Long ownerId,
                                         @RequestParam(required = false) Long raceId) {
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

    @PostMapping
    public JockeyInvitation create(@RequestBody InvitationRequest request) {
        return workflowService.inviteJockey(request);
    }

    @PatchMapping("/{id}/respond")
    public JockeyInvitation respond(@PathVariable Long id,
                                    @RequestBody InvitationDecisionRequest request) {
        return workflowService.respondToInvitation(id, request);
    }
}

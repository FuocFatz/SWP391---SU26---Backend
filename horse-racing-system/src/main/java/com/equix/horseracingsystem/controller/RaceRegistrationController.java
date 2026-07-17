package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.RefereeCheckRequest;
import com.equix.horseracingsystem.entity.RaceRegistration;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
public class RaceRegistrationController {
    private final RaceWorkflowService workflowService;

    public RaceRegistrationController(RaceWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<RaceRegistration> getMine(Principal principal, @RequestParam(required = false) String status) {
        return workflowService.registrationsFor(principal.getName(), status);
    }

    @PatchMapping("/{id}/approve")
    public RaceRegistration approve(Principal principal, @PathVariable Long id) {
        return workflowService.approveRegistration(principal.getName(), id);
    }

    @PatchMapping("/{id}/owner-confirm")
    public RaceRegistration ownerConfirm(Principal principal, @PathVariable Long id) {
        return workflowService.ownerConfirm(principal.getName(), id);
    }

    @PatchMapping("/{id}/withdraw")
    public RaceRegistration withdraw(Principal principal, @PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "Withdrawn" : body.getOrDefault("reason", "Withdrawn");
        return workflowService.withdrawRegistration(principal.getName(), id, reason);
    }

    @PatchMapping("/{id}/referee-check")
    public RaceRegistration refereeCheck(Principal principal, @PathVariable Long id,
                                         @RequestBody RefereeCheckRequest request) {
        return workflowService.refereeCheck(principal.getName(), id, request);
    }
}

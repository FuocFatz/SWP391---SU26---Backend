package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.RefereeCheckRequest;
import com.equix.horseracingsystem.entity.RaceRegistration;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin("*")
public class RaceRegistrationController {

    private final RaceRegistrationRepository registrationRepository;
    private final RaceWorkflowService workflowService;

    public RaceRegistrationController(
            RaceRegistrationRepository registrationRepository,
            RaceWorkflowService workflowService) {
        this.registrationRepository = registrationRepository;
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<RaceRegistration> getAll(@RequestParam(required = false) Long ownerId,
                                         @RequestParam(required = false) Long jockeyId,
                                         @RequestParam(required = false) String status) {
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

    @PatchMapping("/{id}/approve")
    public RaceRegistration approve(@PathVariable Long id) {
        return workflowService.approveRegistration(id);
    }

    @PatchMapping("/{id}/owner-confirm")
    public RaceRegistration ownerConfirm(@PathVariable Long id) {
        return workflowService.ownerConfirm(id);
    }

    @PatchMapping("/{id}/withdraw")
    public RaceRegistration withdraw(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "Withdrawn" : body.getOrDefault("reason", "Withdrawn");
        return workflowService.withdrawRegistration(id, reason);
    }

    @PatchMapping("/{id}/referee-check")
    public RaceRegistration refereeCheck(@PathVariable Long id,
                                         @RequestBody RefereeCheckRequest request) {
        return workflowService.refereeCheck(id, request);
    }
}

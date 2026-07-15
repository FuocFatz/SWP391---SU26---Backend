package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.ConfirmRaceResultsRequest;
import com.equix.horseracingsystem.entity.RaceResult;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/race-results")
@CrossOrigin("*")
@Tag(name = "Race Results")
public class RaceResultController {
    private final RaceWorkflowService workflowService;

    public RaceResultController(RaceWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping
    @PreAuthorize("hasRole('REFEREE')")
    public List<RaceResult> confirmResults(@RequestBody ConfirmRaceResultsRequest request) {
        if (request.getRaceId() == null) throw new IllegalArgumentException("raceId is required");
        return workflowService.confirmResults(request.getRaceId(), request);
    }
}

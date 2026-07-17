package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.PredictionRequest;
import com.equix.horseracingsystem.entity.Prediction;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {
    private final RaceWorkflowService workflowService;

    public PredictionController(RaceWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<Prediction> getMine(Principal principal, @RequestParam(required = false) Long raceId) {
        return workflowService.predictionsFor(principal.getName(), raceId);
    }

    @PostMapping
    public Prediction createPrediction(Principal principal, @RequestBody PredictionRequest request) {
        if (request.getRaceId() == null) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "raceId is required");
        }
        return workflowService.createPrediction(principal.getName(), request.getRaceId(), request);
    }
}

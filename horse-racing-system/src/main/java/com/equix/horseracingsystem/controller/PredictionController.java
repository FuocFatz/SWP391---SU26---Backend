package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Prediction;
import com.equix.horseracingsystem.repository.PredictionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin("*")
public class PredictionController {

    private final PredictionRepository predictionRepository;

    public PredictionController(PredictionRepository predictionRepository) {
        this.predictionRepository = predictionRepository;
    }

    @GetMapping
    public List<Prediction> getAll(@RequestParam(required = false) Long spectatorId,
                                   @RequestParam(required = false) Long raceId) {
        if (spectatorId != null) {
            return predictionRepository.findBySpectatorId(spectatorId);
        }
        if (raceId != null) {
            return predictionRepository.findByRaceId(raceId);
        }
        return predictionRepository.findAll();
    }
}

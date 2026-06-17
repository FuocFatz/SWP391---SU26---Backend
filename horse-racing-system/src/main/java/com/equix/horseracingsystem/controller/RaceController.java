package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/races")
@CrossOrigin("*")
@SuppressWarnings("null")
public class RaceController {

    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final RaceResultRepository resultRepository;
    private final PredictionRepository predictionRepository;
    private final RaceWorkflowService workflowService;

    public RaceController(
            RaceRepository raceRepository,
            RaceRegistrationRepository registrationRepository,
            RaceResultRepository resultRepository,
            PredictionRepository predictionRepository,
            RaceWorkflowService workflowService) {
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.resultRepository = resultRepository;
        this.predictionRepository = predictionRepository;
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<Race> getAll(@RequestParam(required = false) Long tournamentId,
                             @RequestParam(required = false) Long refereeId,
                             @RequestParam(required = false) String status) {
        if (tournamentId != null) {
            return raceRepository.findByTournamentId(tournamentId);
        }
        if (refereeId != null) {
            return raceRepository.findByRefereeId(refereeId);
        }
        if (status != null && !status.isBlank()) {
            return raceRepository.findByStatus(status);
        }
        return raceRepository.findAll();
    }

    @GetMapping("/{id}")
    public Race getById(@PathVariable Long id) {
        return raceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Race not found: " + id));
    }

    @PostMapping
    public Race create(@RequestBody Race race) {
        return raceRepository.save(race);
    }

    @PutMapping("/{id}")
    public Race update(@PathVariable Long id, @RequestBody Race race) {
        Race existing = getById(id);
        existing.setTournamentId(race.getTournamentId());
        existing.setName(race.getName());
        existing.setType(race.getType());
        existing.setDistanceM(race.getDistanceM());
        existing.setSurface(race.getSurface());
        existing.setRaceDate(race.getRaceDate());
        existing.setRaceTime(race.getRaceTime());
        existing.setMaxParticipants(race.getMaxParticipants());
        existing.setPrizePool(race.getPrizePool());
        existing.setRefereeId(race.getRefereeId());
        existing.setStatus(race.getStatus());
        return raceRepository.save(existing);
    }

    @PatchMapping("/{id}/status")
    public Race updateStatus(@PathVariable Long id, @RequestParam String status) {
        Race race = getById(id);
        race.setStatus(status);
        return raceRepository.save(race);
    }

    @GetMapping("/{id}/registrations")
    public List<RaceRegistration> getRegistrations(@PathVariable Long id) {
        return registrationRepository.findByRaceId(id);
    }

    @PostMapping("/{id}/registrations")
    public RaceRegistration registerHorse(@PathVariable Long id,
                                          @RequestBody RaceRegistrationRequest request) {
        return workflowService.registerHorse(id, request);
    }

    @PostMapping("/{id}/start")
    public Race startRace(@PathVariable Long id) {
        return workflowService.startRace(id);
    }

    @GetMapping("/{id}/simulate")
    public Map<String, Object> simulateRace(@PathVariable Long id,
                                            @RequestParam(required = false) Integer durationSeconds) {
        return workflowService.simulateRace(id, durationSeconds);
    }

    @GetMapping("/{id}/results")
    public List<RaceResult> getResults(@PathVariable Long id) {
        return resultRepository.findByRaceIdOrderByFinishPositionAsc(id);
    }

    @PostMapping("/{id}/results")
    public List<RaceResult> confirmResults(@PathVariable Long id,
                                           @RequestBody ConfirmRaceResultsRequest request) {
        return workflowService.confirmResults(id, request);
    }

    @GetMapping("/{id}/predictions")
    public List<Prediction> getPredictions(@PathVariable Long id) {
        return predictionRepository.findByRaceId(id);
    }

    @PostMapping("/{id}/predictions")
    public Prediction createPrediction(@PathVariable Long id,
                                       @RequestBody PredictionRequest request) {
        return workflowService.createPrediction(id, request);
    }

    @GetMapping("/leaderboard/horses")
    public List<Map<String, Object>> horseLeaderboard() {
        return workflowService.horseLeaderboard();
    }

    @GetMapping("/leaderboard/jockeys")
    public List<Map<String, Object>> jockeyLeaderboard() {
        return workflowService.jockeyLeaderboard();
    }
}

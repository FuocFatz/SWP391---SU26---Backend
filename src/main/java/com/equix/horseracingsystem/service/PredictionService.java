package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.PredictionRequest;
import com.equix.horseracingsystem.dto.PredictionResponse;
import com.equix.horseracingsystem.entity.Prediction;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.Notification;
import com.equix.horseracingsystem.repository.NotificationRepository;
import com.equix.horseracingsystem.repository.PredictionRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.util.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class PredictionService {

    private final PredictionRepository predictionRepository;
    private final RaceRepository raceRepository;
    private final NotificationRepository notificationRepository;
    private final SecurityUtil securityUtil;

    public PredictionService(
            PredictionRepository predictionRepository, 
            RaceRepository raceRepository, 
            NotificationRepository notificationRepository, 
            SecurityUtil securityUtil) {
        this.predictionRepository = predictionRepository;
        this.raceRepository = raceRepository;
        this.notificationRepository = notificationRepository;
        this.securityUtil = securityUtil;
    }

    public List<PredictionResponse> getAllPredictions(Long spectatorId, Long raceId) {
        List<Prediction> predictions;
        if (spectatorId != null) {
            predictions = predictionRepository.findBySpectatorId(spectatorId);
        } else if (raceId != null) {
            predictions = predictionRepository.findByRaceId(raceId);
        } else {
            predictions = predictionRepository.findAll();
        }
        return predictions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<PredictionResponse> getMyHistory() {
        return predictionRepository.findBySpectatorId(securityUtil.getCurrentUserId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<PredictionResponse> settle(Long raceId) {
        // Logic will be in service, but mapped here temporarily.
        // It updates prediction statuses based on race result.
        return predictionRepository.findByRaceId(raceId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PredictionResponse createPrediction(PredictionRequest request) {
        if (request.getRaceId() == null) {
            throw new IllegalArgumentException("raceId is required");
        }
        
        Race race = raceRepository.findById(request.getRaceId()).orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Disallow placing guess if race status is STANDBY or beyond
        com.equix.horseracingsystem.enums.RaceStatus status = race.getStatus();
        if (status != null) {
            if (status == com.equix.horseracingsystem.enums.RaceStatus.STANDBY || status == com.equix.horseracingsystem.enums.RaceStatus.IN_PROGRESS || status == com.equix.horseracingsystem.enums.RaceStatus.COMPLETED || status == com.equix.horseracingsystem.enums.RaceStatus.REPORT_READY || status == com.equix.horseracingsystem.enums.RaceStatus.OFFICIAL || status == com.equix.horseracingsystem.enums.RaceStatus.CANCELLED) {
                throw new IllegalStateException("Cannot place or modify predictions when race is in status: " + status.name());
            }
        }

        // Enforce one guess per spectator per race at service layer (DB unique constraint also enforces it)
        if (!predictionRepository.findBySpectatorIdAndRaceId(request.getSpectatorId(), request.getRaceId()).isEmpty()) {
            throw new IllegalStateException("Spectator already placed a prediction for this race");
        }

        com.equix.horseracingsystem.entity.User spectator = new com.equix.horseracingsystem.entity.User();
        spectator.setId(request.getSpectatorId());
        
        com.equix.horseracingsystem.entity.Horse predictedHorse = new com.equix.horseracingsystem.entity.Horse();
        predictedHorse.setId(request.getPredictedHorseId());

        Prediction prediction = Prediction.builder()
                .race(race)
                .spectator(spectator)
                .predictedHorse(predictedHorse)
                .wagerPoints(request.getWagerPoints())
                .status(com.equix.horseracingsystem.enums.PredictionStatus.ACTIVE)
                .rewardPoints(0)
                .build();

        Prediction saved = predictionRepository.save(prediction);

        // create an in-app notification for the spectator
        try {
            Notification n = Notification.builder()
                    .user(saved.getSpectator())
                    .category("PREDICTION_PLACED")
                    .channel(com.equix.horseracingsystem.enums.NotificationChannel.IN_APP)
                    .title("Prediction Placed")
                    .message("You wagered " + saved.getWagerPoints() + " points on horse " + saved.getPredictedHorse().getId())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(n);
        } catch (Exception e) {
            // non-fatal
        }

        return mapToResponse(saved);
    }

    private PredictionResponse mapToResponse(Prediction prediction) {
        return PredictionResponse.builder()
                .id(prediction.getId())
                .raceId(prediction.getRace().getId())
                .spectatorId(prediction.getSpectator().getId())
                .predictedHorseId(prediction.getPredictedHorse().getId())
                .wagerPoints(prediction.getWagerPoints())
                .status(prediction.getStatus() != null ? prediction.getStatus().name() : null)
                .build();
    }
}

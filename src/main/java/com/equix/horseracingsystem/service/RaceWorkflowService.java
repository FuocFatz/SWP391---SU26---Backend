package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class RaceWorkflowService {

    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final JockeyInvitationRepository invitationRepository;
    private final RaceResultRepository resultRepository;
    private final PredictionRepository predictionRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    public RaceWorkflowService(
            RaceRepository raceRepository,
            RaceRegistrationRepository registrationRepository,
            JockeyInvitationRepository invitationRepository,
            RaceResultRepository resultRepository,
            PredictionRepository predictionRepository,
            HorseRepository horseRepository,
            UserRepository userRepository) {
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.invitationRepository = invitationRepository;
        this.resultRepository = resultRepository;
        this.predictionRepository = predictionRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RaceRegistration registerHorse(Long raceId, RaceRegistrationRequest request) {
        Race race = getRace(raceId);
        if (!"REGISTRATION_OPEN".equals(race.getStatus())) {
            throw new RuntimeException("Race is not open for registration");
        }
        if (registrationRepository.existsByRaceIdAndHorseId(raceId, request.getHorseId())) {
            throw new RuntimeException("Horse already registered for this race");
        }

        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId);
        int nextLane = registrations.size() + 1;
        if (race.getMaxParticipants() != null && nextLane > race.getMaxParticipants()) {
            throw new RuntimeException("Race is full");
        }

        RaceRegistration registration = RaceRegistration.builder()
                .raceId(raceId)
                .horseId(request.getHorseId())
                .ownerId(request.getOwnerId())
                .laneNumber(nextLane)
                .status("PENDING_ADMIN")
                .ownerConfirmed(true)
                .jockeyConfirmed(false)
                .refereeApproved(false)
                .healthCheckStatus("PENDING")
                .build();

        return registrationRepository.save(registration);
    }

    @Transactional
    public RaceRegistration approveRegistration(Long registrationId) {
        RaceRegistration registration = getRegistration(registrationId);
        registration.setStatus("APPROVED");
        return registrationRepository.save(registration);
    }

    @Transactional
    public RaceRegistration ownerConfirm(Long registrationId) {
        RaceRegistration registration = getRegistration(registrationId);
        registration.setOwnerConfirmed(true);
        return registrationRepository.save(registration);
    }

    @Transactional
    public RaceRegistration withdrawRegistration(Long registrationId, String reason) {
        RaceRegistration registration = getRegistration(registrationId);
        registration.setStatus("WITHDRAWN");
        registration.setWithdrawReason(reason);
        return registrationRepository.save(registration);
    }

    @Transactional
    public JockeyInvitation inviteJockey(InvitationRequest request) {
        RaceRegistration registration = registrationRepository
                .findByRaceIdAndHorseId(request.getRaceId(), request.getHorseId())
                .orElseThrow(() -> new RuntimeException("Horse must be registered before inviting a jockey"));

        JockeyInvitation invitation = JockeyInvitation.builder()
                .raceId(request.getRaceId())
                .horseId(request.getHorseId())
                .ownerId(request.getOwnerId())
                .jockeyId(request.getJockeyId())
                .message(request.getMessage())
                .status("PENDING")
                .build();

        registration.setJockeyId(request.getJockeyId());
        registrationRepository.save(registration);

        return invitationRepository.save(invitation);
    }

    @Transactional
    public JockeyInvitation respondToInvitation(Long invitationId, InvitationDecisionRequest request) {
        JockeyInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found: " + invitationId));

        String decision = request.getStatus() == null ? "DECLINED" : request.getStatus().toUpperCase();
        invitation.setStatus(decision);
        invitation.setResponseNote(request.getResponseNote());
        invitation.setRespondedAt(LocalDateTime.now());

        registrationRepository.findByRaceIdAndHorseId(invitation.getRaceId(), invitation.getHorseId())
                .ifPresent(registration -> {
                    if ("ACCEPTED".equals(decision)) {
                        registration.setJockeyId(invitation.getJockeyId());
                        registration.setJockeyConfirmed(true);
                        if ("APPROVED".equals(registration.getStatus())) {
                            registration.setStatus("READY_FOR_CHECK");
                        }
                    } else {
                        registration.setJockeyConfirmed(false);
                        registration.setStatus("JOCKEY_DECLINED");
                    }
                    registrationRepository.save(registration);
                });

        return invitationRepository.save(invitation);
    }

    @Transactional
    public RaceRegistration refereeCheck(Long registrationId, RefereeCheckRequest request) {
        RaceRegistration registration = getRegistration(registrationId);
        boolean approved = Boolean.TRUE.equals(request.getApproved());

        registration.setRefereeApproved(approved);
        registration.setHealthCheckStatus(
                request.getHealthCheckStatus() == null
                        ? (approved ? "FIT" : "NOT_FIT")
                        : request.getHealthCheckStatus()
        );
        registration.setRefereeNotes(request.getNotes());
        registration.setStatus(approved ? "CLEARED_TO_RACE" : "REJECTED_BY_REFEREE");

        return registrationRepository.save(registration);
    }

    @Transactional
    public Race startRace(Long raceId) {
        Race race = getRace(raceId);
        long readyCount = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> "CLEARED_TO_RACE".equals(item.getStatus()))
                .count();
        if (readyCount == 0) {
            throw new RuntimeException("No horses cleared by referee");
        }
        race.setStatus("IN_PROGRESS");
        return raceRepository.save(race);
    }

    public Map<String, Object> simulateRace(Long raceId, Integer durationSeconds) {
        Race race = getRace(raceId);
        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> !"WITHDRAWN".equals(item.getStatus()))
                .toList();
        int duration = durationSeconds == null ? 60 : durationSeconds;
        Random random = new Random(raceId + duration);

        List<Map<String, Object>> lanes = registrations.stream().map(registration -> {
            Horse horse = horseRepository.findById(registration.getHorseId()).orElse(null);
            int base = 35 + random.nextInt(50);
            int speedBonus = horse == null || horse.getSpeed() == null ? 0 : horse.getSpeed() / 5;
            int position = Math.min(100, base + speedBonus + random.nextInt(12));

            Map<String, Object> lane = new LinkedHashMap<>();
            lane.put("registrationId", registration.getId());
            lane.put("laneNumber", registration.getLaneNumber());
            lane.put("horseId", registration.getHorseId());
            lane.put("horseName", horse == null ? "Horse #" + registration.getHorseId() : horse.getHorseName());
            lane.put("jockeyId", registration.getJockeyId());
            lane.put("position", position);
            lane.put("status", position >= 100 ? "FINISHED" : race.getStatus());
            return lane;
        }).sorted((a, b) -> Integer.compare((Integer) b.get("position"), (Integer) a.get("position")))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("raceId", raceId);
        response.put("raceName", race.getName());
        response.put("durationSeconds", duration);
        response.put("lanes", lanes);
        return response;
    }

    @Transactional
    public List<RaceResult> confirmResults(Long raceId, ConfirmRaceResultsRequest request) {
        Race race = getRace(raceId);
        List<RaceResultRequest> resultRequests = request.getResults() == null ? List.of() : request.getResults();
        if (resultRequests.isEmpty()) {
            throw new RuntimeException("Result list is required");
        }

        List<RaceResult> oldResults = resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
        resultRepository.deleteAll(oldResults);

        List<RaceResult> saved = new ArrayList<>();
        for (RaceResultRequest item : resultRequests) {
            RaceRegistration registration = getRegistration(item.getRegistrationId());
            int points = calculateRacePoints(item.getFinishPosition());

            RaceResult result = RaceResult.builder()
                    .raceId(raceId)
                    .registrationId(registration.getId())
                    .horseId(registration.getHorseId())
                    .jockeyId(registration.getJockeyId())
                    .ownerId(registration.getOwnerId())
                    .finishPosition(item.getFinishPosition())
                    .finishTimeSeconds(item.getFinishTimeSeconds() == null ? BigDecimal.ZERO : item.getFinishTimeSeconds())
                    .pointsAwarded(points)
                    .violationNotes(item.getViolationNotes())
                    .official(true)
                    .build();

            saved.add(resultRepository.save(result));
            applyStandingPoints(registration, item.getFinishPosition(), points);
        }

        race.setStatus("OFFICIAL");
        raceRepository.save(race);
        settlePredictions(raceId, saved);

        return resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
    }

    @Transactional
    public Prediction createPrediction(Long raceId, PredictionRequest request) {
        Prediction prediction = Prediction.builder()
                .raceId(raceId)
                .spectatorId(request.getSpectatorId())
                .predictedHorseId(request.getPredictedHorseId())
                .wagerPoints(request.getWagerPoints())
                .status("PENDING")
                .rewardPoints(0)
                .build();
        return predictionRepository.save(prediction);
    }

    public List<Map<String, Object>> horseLeaderboard() {
        return horseRepository.findAll().stream()
                .sorted(Comparator.comparing(Horse::getTotalPoints, Comparator.nullsFirst(Integer::compareTo)).reversed())
                .map(horse -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("horseId", horse.getId());
                    row.put("horseName", horse.getHorseName());
                    row.put("ownerId", horse.getOwnerId());
                    row.put("totalRaces", value(horse.getTotalRaces()));
                    row.put("totalWins", value(horse.getTotalWins()));
                    row.put("totalTop3", value(horse.getTotalTop3()));
                    row.put("totalPoints", value(horse.getTotalPoints()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> jockeyLeaderboard() {
        Map<Long, IntSummaryStatistics> grouped = resultRepository.findAll().stream()
                .filter(result -> result.getJockeyId() != null)
                .collect(Collectors.groupingBy(RaceResult::getJockeyId,
                        Collectors.summarizingInt(result -> value(result.getPointsAwarded()))));

        return grouped.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue().getSum(), a.getValue().getSum()))
                .map(entry -> {
                    User jockey = userRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("jockeyId", entry.getKey());
                    row.put("jockeyName", jockey == null ? "Jockey #" + entry.getKey() : jockey.getFullName());
                    row.put("totalRaces", entry.getValue().getCount());
                    row.put("totalPoints", entry.getValue().getSum());
                    return row;
                })
                .collect(Collectors.toList());
    }

    private void applyStandingPoints(RaceRegistration registration, Integer finishPosition, int points) {
        horseRepository.findById(registration.getHorseId()).ifPresent(horse -> {
            horse.setTotalRaces(value(horse.getTotalRaces()) + 1);
            horse.setTotalPoints(value(horse.getTotalPoints()) + points);
            if (finishPosition != null && finishPosition == 1) {
                horse.setTotalWins(value(horse.getTotalWins()) + 1);
            }
            if (finishPosition != null && finishPosition <= 3) {
                horse.setTotalTop3(value(horse.getTotalTop3()) + 1);
            }
            horseRepository.save(horse);
        });

        userRepository.findById(registration.getOwnerId()).ifPresent(owner -> {
            owner.setRewardPoints(value(owner.getRewardPoints()) + points);
            userRepository.save(owner);
        });
    }

    private void settlePredictions(Long raceId, List<RaceResult> results) {
        Optional<RaceResult> winner = results.stream()
                .filter(result -> result.getFinishPosition() != null && result.getFinishPosition() == 1)
                .findFirst();
        if (winner.isEmpty()) {
            return;
        }

        List<Prediction> predictions = predictionRepository.findByRaceId(raceId);
        int totalPool = predictions.stream().mapToInt(prediction -> value(prediction.getWagerPoints())).sum();
        List<Prediction> winners = predictions.stream()
                .filter(prediction -> Objects.equals(prediction.getPredictedHorseId(), winner.get().getHorseId()))
                .toList();
        int rewardEach = winners.isEmpty() ? 0 : Math.max(1, (int) Math.floor((totalPool * 0.9) / winners.size()));

        for (Prediction prediction : predictions) {
            boolean correct = Objects.equals(prediction.getPredictedHorseId(), winner.get().getHorseId());
            prediction.setStatus(correct ? "WON" : "LOST");
            prediction.setRewardPoints(correct ? rewardEach : 0);
            prediction.setSettledAt(LocalDateTime.now());
            predictionRepository.save(prediction);

            if (correct) {
                userRepository.findById(prediction.getSpectatorId()).ifPresent(user -> {
                    user.setRewardPoints(value(user.getRewardPoints()) + rewardEach);
                    userRepository.save(user);
                });
            }
        }
    }

    private int calculateRacePoints(Integer finishPosition) {
        if (finishPosition == null) {
            return 0;
        }
        return switch (finishPosition) {
            case 1 -> 100;
            case 2 -> 60;
            case 3 -> 30;
            default -> Math.max(5, 20 - finishPosition);
        };
    }

    private Race getRace(Long raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new RuntimeException("Race not found: " + raceId));
    }

    private RaceRegistration getRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Race registration not found: " + registrationId));
    }

    private int value(Integer number) {
        return number == null ? 0 : number;
    }
}

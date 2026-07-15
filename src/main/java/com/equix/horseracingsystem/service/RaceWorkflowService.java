package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.enums.*;
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

    public com.equix.horseracingsystem.dto.RaceRegistrationResponse registerHorse(Long raceId, RaceRegistrationRequest request) {
        Race race = getRace(raceId);
        if (race.getStatus() != RaceStatus.REGISTRATION_OPEN) {
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

        Horse horse = horseRepository.findById(request.getHorseId())
                .orElseThrow(() -> new RuntimeException("Horse not found: " + request.getHorseId()));
        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner not found: " + request.getOwnerId()));
        
        // Resolve jockey (DB constraint: jockey_id is NOT NULL)
        if (request.getJockeyId() == null) {
            throw new IllegalArgumentException("jockeyId is required to register for a race");
        }
        User jockey = userRepository.findById(request.getJockeyId())
                .orElseThrow(() -> new RuntimeException("Jockey not found: " + request.getJockeyId()));

        RaceRegistration registration = RaceRegistration.builder()
                .race(race)
                .horse(horse)
                .owner(owner)
                .jockey(jockey)
                .laneNumber(nextLane)
                .status(RegistrationStatus.PENDING_ADMIN)
                .ownerConfirmed(true)
                .jockeyConfirmed(false)
                .refereeApproved(false)
                .healthCheckStatus("PENDING")
                .build();

        RaceRegistration saved = registrationRepository.save(registration);
        return com.equix.horseracingsystem.dto.RaceRegistrationResponse.builder()
                .id(saved.getId())
                .raceId(saved.getRace().getId())
                .horseId(saved.getHorse().getId())
                .jockeyId(saved.getJockey().getId())
                .ownerId(saved.getOwner().getId())
                .status(saved.getStatus().name())
                .build();
    }

    @Transactional
    public RaceRegistration approveRegistration(Long registrationId) {
        RaceRegistration registration = getRegistration(registrationId);
        registration.setStatus(RegistrationStatus.APPROVED);
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
        registration.setStatus(RegistrationStatus.WITHDRAWN);
        registration.setWithdrawReason(reason);
        return registrationRepository.save(registration);
    }

    @Transactional
    public JockeyInvitationResponse inviteJockey(InvitationRequest request) {
        RaceRegistration registration = registrationRepository
                .findByRaceIdAndHorseId(request.getRaceId(), request.getHorseId())
                .orElseThrow(() -> new RuntimeException("Horse must be registered before inviting a jockey"));

        Race race = getRace(request.getRaceId());
        Horse horse = horseRepository.findById(request.getHorseId()).orElseThrow();
        User owner = userRepository.findById(request.getOwnerId()).orElseThrow();
        User jockey = userRepository.findById(request.getJockeyId()).orElseThrow();

        JockeyInvitation invitation = JockeyInvitation.builder()
                .race(race)
                .horse(horse)
                .owner(owner)
                .jockey(jockey)
                .message(request.getMessage())
                .status(InvitationStatus.PENDING)
                .build();

        registration.setJockey(jockey);
        registrationRepository.save(registration);

        JockeyInvitation saved = invitationRepository.save(invitation);
        return mapInvitationToResponse(saved);
    }

    @Transactional
    public JockeyInvitationResponse respondToInvitation(Long invitationId, InvitationDecisionRequest request) {
        JockeyInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found: " + invitationId));

        InvitationStatus decision = request.getStatus() == null ? InvitationStatus.DECLINED : InvitationStatus.valueOf(request.getStatus().toUpperCase());
        invitation.setStatus(decision);
        invitation.setResponseNote(request.getResponseNote());
        invitation.setRespondedAt(LocalDateTime.now());

        registrationRepository.findByRaceIdAndHorseId(invitation.getRace().getId(), invitation.getHorse().getId())
                .ifPresent(registration -> {
                    if (decision == InvitationStatus.ACCEPTED) {
                        registration.setJockey(invitation.getJockey());
                        registration.setJockeyConfirmed(true);
                        if (registration.getStatus() == RegistrationStatus.PENDING_ADMIN) {
                            registration.setStatus(RegistrationStatus.APPROVED);
                        }
                    } else {
                        registration.setJockeyConfirmed(false);
                        registration.setStatus(RegistrationStatus.REJECTED);
                    }
                    registrationRepository.save(registration);
                });

        JockeyInvitation saved = invitationRepository.save(invitation);
        return mapInvitationToResponse(saved);
    }

    public com.equix.horseracingsystem.dto.JockeyInvitationResponse mapInvitationToResponse(JockeyInvitation invitation) {
        return com.equix.horseracingsystem.dto.JockeyInvitationResponse.builder()
                .id(invitation.getId())
                .raceId(invitation.getRace() != null ? invitation.getRace().getId() : null)
                .raceName(invitation.getRace() != null ? invitation.getRace().getName() : null)
                .horseId(invitation.getHorse() != null ? invitation.getHorse().getId() : null)
                .horseName(invitation.getHorse() != null ? invitation.getHorse().getHorseName() : null)
                .ownerId(invitation.getOwner() != null ? invitation.getOwner().getId() : null)
                .ownerName(invitation.getOwner() != null ? invitation.getOwner().getFullName() : null)
                .jockeyId(invitation.getJockey() != null ? invitation.getJockey().getId() : null)
                .jockeyName(invitation.getJockey() != null ? invitation.getJockey().getFullName() : null)
                .status(invitation.getStatus() != null ? invitation.getStatus().name() : null)
                .message(invitation.getMessage())
                .responseNote(invitation.getResponseNote())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .build();
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
        registration.setStatus(approved ? RegistrationStatus.APPROVED : RegistrationStatus.REJECTED);

        return registrationRepository.save(registration);
    }

    @Transactional
    public Race startRace(Long raceId) {
        Race race = getRace(raceId);
        long readyCount = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> item.getStatus() == RegistrationStatus.APPROVED)
                .count();
        if (readyCount == 0) {
            throw new RuntimeException("No horses cleared by referee");
        }
        race.setStatus(RaceStatus.IN_PROGRESS);
        return raceRepository.save(race);
    }

    public Map<String, Object> simulateRace(Long raceId, Integer durationSeconds) {
        Race race = getRace(raceId);
        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> item.getStatus() != RegistrationStatus.WITHDRAWN)
                .toList();
        int duration = durationSeconds == null ? 60 : durationSeconds;
        Random random = new Random(raceId + duration);

        List<Map<String, Object>> lanes = registrations.stream().map(registration -> {
            Horse horse = registration.getHorse();
            int base = 35 + random.nextInt(50);
            int speedBonus = horse == null || horse.getSpeed() == null ? 0 : horse.getSpeed() / 5;
            int position = Math.min(100, base + speedBonus + random.nextInt(12));

            Map<String, Object> lane = new LinkedHashMap<>();
            lane.put("registrationId", registration.getId());
            lane.put("laneNumber", registration.getLaneNumber());
            lane.put("horseId", horse != null ? horse.getId() : null);
            lane.put("horseName", horse == null ? "Horse" : horse.getHorseName());
            lane.put("jockeyId", registration.getJockey() != null ? registration.getJockey().getId() : null);
            lane.put("position", position);
            lane.put("status", position >= 100 ? "FINISHED" : race.getStatus().name());
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
                    .race(race)
                    .registration(registration)
                    .horse(registration.getHorse())
                    .jockey(registration.getJockey())
                    .owner(registration.getOwner())
                    .finishPosition(item.getFinishPosition())
                    .finishTimeSeconds(item.getFinishTimeSeconds() == null ? BigDecimal.ZERO : item.getFinishTimeSeconds())
                    .pointsAwarded(points)
                    .violationNotes(item.getViolationNotes())
                    .official(true)
                    .build();

            saved.add(resultRepository.save(result));
            applyStandingPoints(registration, item.getFinishPosition(), points);
        }

        race.setStatus(RaceStatus.OFFICIAL);
        raceRepository.save(race);
        settlePredictions(raceId, saved);

        return resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
    }

    @Transactional
    public Prediction createPrediction(Long raceId, PredictionRequest request) {
        Race race = getRace(raceId);
        User spectator = userRepository.findById(request.getSpectatorId()).orElseThrow();
        Horse predictedHorse = horseRepository.findById(request.getPredictedHorseId()).orElseThrow();
        Prediction prediction = Prediction.builder()
                .race(race)
                .spectator(spectator)
                .predictedHorse(predictedHorse)
                .wagerPoints(request.getWagerPoints())
                .status(PredictionStatus.ACTIVE)
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
                    row.put("ownerId", horse.getOwner() != null ? horse.getOwner().getId() : null);
                    row.put("totalRaces", value(horse.getTotalRaces()));
                    row.put("totalWins", value(horse.getTotalWins()));
                    row.put("totalTop3", value(horse.getTotalTop3()));
                    row.put("totalPoints", value(horse.getTotalPoints()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> jockeyLeaderboard() {
        Map<User, IntSummaryStatistics> grouped = resultRepository.findAll().stream()
                .filter(result -> result.getJockey() != null)
                .collect(Collectors.groupingBy(RaceResult::getJockey,
                        Collectors.summarizingInt(result -> value(result.getPointsAwarded()))));

        return grouped.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue().getSum(), a.getValue().getSum()))
                .map(entry -> {
                    User jockey = entry.getKey();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("jockeyId", jockey.getId());
                    row.put("jockeyName", jockey.getFullName());
                    row.put("totalRaces", entry.getValue().getCount());
                    row.put("totalPoints", entry.getValue().getSum());
                    return row;
                })
                .collect(Collectors.toList());
    }

    private void applyStandingPoints(RaceRegistration registration, Integer finishPosition, int points) {
        if (registration.getHorse() != null) {
            Horse horse = registration.getHorse();
            horse.setTotalRaces(value(horse.getTotalRaces()) + 1);
            horse.setTotalPoints(value(horse.getTotalPoints()) + points);
            if (finishPosition != null && finishPosition == 1) {
                horse.setTotalWins(value(horse.getTotalWins()) + 1);
            }
            if (finishPosition != null && finishPosition <= 3) {
                horse.setTotalTop3(value(horse.getTotalTop3()) + 1);
            }
            horseRepository.save(horse);
        }

        if (registration.getOwner() != null) {
            User owner = registration.getOwner();
            owner.setRewardPoints(value(owner.getRewardPoints()) + points);
            userRepository.save(owner);
        }
    }

    private void settlePredictions(Long raceId, List<RaceResult> results) {
        Optional<RaceResult> winner = results.stream()
                .filter(result -> result.getFinishPosition() != null && result.getFinishPosition() == 1)
                .findFirst();
        if (winner.isEmpty() || winner.get().getHorse() == null) {
            return;
        }

        List<Prediction> predictions = predictionRepository.findByRaceId(raceId);
        int totalPool = predictions.stream().mapToInt(prediction -> value(prediction.getWagerPoints())).sum();
        List<Prediction> winners = predictions.stream()
                .filter(prediction -> prediction.getPredictedHorse() != null && Objects.equals(prediction.getPredictedHorse().getId(), winner.get().getHorse().getId()))
                .toList();
        int rewardEach = winners.isEmpty() ? 0 : Math.max(1, (int) Math.floor((totalPool * 0.9) / winners.size()));

        for (Prediction prediction : predictions) {
            boolean correct = prediction.getPredictedHorse() != null && Objects.equals(prediction.getPredictedHorse().getId(), winner.get().getHorse().getId());
            // Status remains ACTIVE or LOCKED, points indicate win/loss
            prediction.setRewardPoints(correct ? rewardEach : 0);
            prediction.setSettledAt(LocalDateTime.now());
            predictionRepository.save(prediction);

            if (correct && prediction.getSpectator() != null) {
                User spectator = prediction.getSpectator();
                spectator.setRewardPoints(value(spectator.getRewardPoints()) + rewardEach);
                userRepository.save(spectator);
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

    public com.equix.horseracingsystem.dto.RaceRegistrationResponse mapRegistrationToResponse(RaceRegistration registration) {
        return com.equix.horseracingsystem.dto.RaceRegistrationResponse.builder()
                .id(registration.getId())
                .raceId(registration.getRace().getId())
                .horseId(registration.getHorse().getId())
                .jockeyId(registration.getJockey().getId())
                .ownerId(registration.getOwner().getId())
                .status(registration.getStatus().name())
                .ownerConfirmed(registration.getOwnerConfirmed())
                .jockeyConfirmed(registration.getJockeyConfirmed())
                .refereeApproved(registration.getRefereeApproved())
                .healthCheckStatus(registration.getHealthCheckStatus())
                .refereeNotes(registration.getRefereeNotes())
                .withdrawReason(registration.getWithdrawReason())
                .build();
    }
}

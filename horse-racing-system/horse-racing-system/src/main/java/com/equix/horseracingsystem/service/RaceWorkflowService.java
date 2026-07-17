package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class RaceWorkflowService {

    private static final Set<String> GUESS_LOCKED_STATUSES = Set.of(
            "STANDBY", "IN_PROGRESS", "COMPLETED", "REPORT_READY", "OFFICIAL", "CANCELLED");
    private static final Set<String> ADMIN_RACE_STATUSES = Set.of(
            "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "STANDBY", "CANCELLED");

    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final JockeyInvitationRepository invitationRepository;
    private final PairingContractRepository pairingRepository;
    private final RaceResultRepository resultRepository;
    private final RaceNoteRepository raceNoteRepository;
    private final PredictionRepository predictionRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;

    public RaceWorkflowService(
            RaceRepository raceRepository,
            RaceRegistrationRepository registrationRepository,
            JockeyInvitationRepository invitationRepository,
            PairingContractRepository pairingRepository,
            RaceResultRepository resultRepository,
            RaceNoteRepository raceNoteRepository,
            PredictionRepository predictionRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogRepository auditLogRepository) {
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.invitationRepository = invitationRepository;
        this.pairingRepository = pairingRepository;
        this.resultRepository = resultRepository;
        this.raceNoteRepository = raceNoteRepository;
        this.predictionRepository = predictionRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public RaceRegistration registerHorse(String email, Long raceId, RaceRegistrationRequest request) {
        User owner = actor(email, "HORSE_OWNER");
        Race race = getRace(raceId);
        requireRegistrationOpen(race);
        if (request.getHorseId() == null) badRequest("horseId is required");

        Horse horse = horseRepository.findById(request.getHorseId())
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse not found"));
        if (!Objects.equals(horse.getOwnerId(), owner.getId())) forbidden("You can only register a horse you own");
        if (registrationRepository.existsByRaceIdAndHorseId(raceId, horse.getId())) conflict("Horse already registered for this race");

        PairingContract pairing = pairingRepository
                .findByHorseIdAndOwnerIdAndStatus(horse.getId(), owner.getId(), "ACTIVE")
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                        "An active horse-jockey pairing is required before race registration"));

        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> item.getDeletedAt() == null && !"WITHDRAWN".equals(item.getStatus()))
                .toList();
        int nextLane = registrations.size() + 1;
        int limit = race.getMaxParticipants() == null ? 18 : race.getMaxParticipants();
        if (limit < 6 || limit > 18) badRequest("Race participant limit must be between 6 and 18");
        if (nextLane > limit) conflict("Race is full");

        RaceRegistration saved = registrationRepository.save(RaceRegistration.builder()
                .raceId(raceId)
                .horseId(horse.getId())
                .ownerId(owner.getId())
                .pairingContractId(pairing.getId())
                .jockeyId(pairing.getJockeyId())
                .laneNumber(nextLane)
                .status("PENDING_ADMIN")
                .ownerConfirmed(true)
                .jockeyConfirmed(true)
                .refereeApproved(false)
                .healthCheckStatus("PENDING")
                .build());
        horse.setStatus("REGISTERED");
        horseRepository.save(horse);
        notificationService.createIfAbsent(pairing.getJockeyId(), "RACE_REGISTRATION", "Pair registered",
                horse.getHorseName() + " was registered for " + race.getName(), "/races/" + raceId);
        audit(owner, "CREATE", "RACE_REGISTRATION", saved.getId(), null, "PENDING_ADMIN");
        return saved;
    }

    @Transactional
    public RaceRegistration approveRegistration(String email, Long registrationId) {
        User admin = actor(email, "ADMIN");
        RaceRegistration registration = getRegistration(registrationId);
        if (!"PENDING_ADMIN".equals(registration.getStatus())) conflict("Only pending registrations can be approved");
        registration.setStatus("READY_FOR_CHECK");
        RaceRegistration saved = registrationRepository.save(registration);
        notifyPair(registration, "REGISTRATION_APPROVED", "Registration approved",
                "Your pair is ready for the referee check");
        audit(admin, "APPROVE", "RACE_REGISTRATION", saved.getId(), "PENDING_ADMIN", saved.getStatus());
        return saved;
    }

    @Transactional
    public RaceRegistration ownerConfirm(String email, Long registrationId) {
        User owner = actor(email, "HORSE_OWNER");
        RaceRegistration registration = getRegistration(registrationId);
        if (!Objects.equals(registration.getOwnerId(), owner.getId())) forbidden("This registration belongs to another owner");
        registration.setOwnerConfirmed(true);
        return registrationRepository.save(registration);
    }

    @Transactional
    public RaceRegistration withdrawRegistration(String email, Long registrationId, String reason) {
        User user = actor(email);
        RaceRegistration registration = getRegistration(registrationId);
        boolean participant = Objects.equals(registration.getOwnerId(), user.getId())
                || Objects.equals(registration.getJockeyId(), user.getId());
        if (!participant && !"ADMIN".equals(user.getRole())) forbidden("You cannot withdraw this registration");
        if ("OFFICIAL".equals(getRace(registration.getRaceId()).getStatus())) conflict("Official race entries cannot be withdrawn");
        if (!"ADMIN".equals(user.getRole())) enforceWithdrawalWindow(getRace(registration.getRaceId()));

        String before = registration.getStatus();
        registration.setStatus("WITHDRAWN");
        registration.setWithdrawReason(reason == null || reason.isBlank() ? "Withdrawn" : reason.trim());
        dissolvePairing(registration);
        RaceRegistration saved = registrationRepository.save(registration);
        notifyPair(registration, "REGISTRATION_WITHDRAWN", "Registration withdrawn", saved.getWithdrawReason());
        audit(user, "WITHDRAW", "RACE_REGISTRATION", saved.getId(), before, "WITHDRAWN");
        return saved;
    }

    @Transactional
    public JockeyInvitation inviteJockey(String email, InvitationRequest request) {
        User owner = actor(email, "HORSE_OWNER");
        if (request.getRaceId() == null || request.getHorseId() == null || request.getJockeyId() == null) {
            badRequest("raceId, horseId and jockeyId are required");
        }
        Race race = getRace(request.getRaceId());
        requireRegistrationOpen(race);
        Horse horse = horseRepository.findById(request.getHorseId())
                .filter(item -> item.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse not found"));
        if (!Objects.equals(horse.getOwnerId(), owner.getId())) forbidden("You can only pair a horse you own");
        if (!"AVAILABLE".equalsIgnoreCase(horse.getStatus())) conflict("Only available horses can be paired");
        User jockey = userRepository.findById(request.getJockeyId())
                .filter(item -> item.getDeletedAt() == null && "JOCKEY".equals(item.getRole()) && isActive(item))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Available jockey not found"));

        if (pairingRepository.existsByHorseIdAndStatus(horse.getId(), "ACTIVE")
                || invitationRepository.existsByHorseIdAndStatus(horse.getId(), "PENDING")) {
            conflict("Horse already has an active or pending pairing");
        }
        if (pairingRepository.existsByJockeyIdAndStatus(jockey.getId(), "ACTIVE")
                || invitationRepository.existsByJockeyIdAndStatus(jockey.getId(), "PENDING")) {
            conflict("Jockey already has an active or pending pairing");
        }

        JockeyInvitation saved = invitationRepository.save(JockeyInvitation.builder()
                .raceId(race.getId())
                .horseId(horse.getId())
                .ownerId(owner.getId())
                .jockeyId(jockey.getId())
                .message(request.getMessage())
                .status("PENDING")
                .build());
        notificationService.createIfAbsent(jockey.getId(), "JOCKEY_INVITATION", "New pairing invitation",
                owner.getFullName() + " invited you to ride " + horse.getHorseName(), "/dashboard");
        audit(owner, "CREATE", "JOCKEY_INVITATION", saved.getId(), null, "PENDING");
        return saved;
    }

    @Transactional
    public JockeyInvitation respondToInvitation(String email, Long invitationId, InvitationDecisionRequest request) {
        User jockey = actor(email, "JOCKEY");
        JockeyInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (!Objects.equals(invitation.getJockeyId(), jockey.getId())) forbidden("This invitation belongs to another jockey");
        if (!"PENDING".equals(invitation.getStatus())) conflict("Invitation has already been answered");
        String decision = request.getStatus() == null ? "" : request.getStatus().toUpperCase(Locale.ROOT);
        if (!Set.of("ACCEPTED", "DECLINED").contains(decision)) badRequest("status must be ACCEPTED or DECLINED");

        if ("ACCEPTED".equals(decision)) {
            if (pairingRepository.existsByHorseIdAndStatus(invitation.getHorseId(), "ACTIVE")
                    || pairingRepository.existsByJockeyIdAndStatus(jockey.getId(), "ACTIVE")) {
                conflict("Horse or jockey is no longer available");
            }
            PairingContract contract = pairingRepository.save(PairingContract.builder()
                    .horseId(invitation.getHorseId())
                    .jockeyId(jockey.getId())
                    .ownerId(invitation.getOwnerId())
                    .status("ACTIVE")
                    .build());
            horseRepository.findById(invitation.getHorseId()).ifPresent(horse -> {
                horse.setStatus("PAIRED");
                horseRepository.save(horse);
            });
            audit(jockey, "CREATE", "PAIRING_CONTRACT", contract.getId(), null, "ACTIVE");
        }
        invitation.setStatus(decision);
        invitation.setResponseNote(request.getResponseNote());
        invitation.setRespondedAt(LocalDateTime.now());
        JockeyInvitation saved = invitationRepository.save(invitation);
        notificationService.createIfAbsent(invitation.getOwnerId(), "INVITATION_RESPONSE", "Jockey responded",
                jockey.getFullName() + " " + decision.toLowerCase(Locale.ROOT) + " your invitation", "/dashboard");
        audit(jockey, "RESPOND", "JOCKEY_INVITATION", saved.getId(), "PENDING", decision);
        return saved;
    }

    @Transactional
    public RaceRegistration refereeCheck(String email, Long registrationId, RefereeCheckRequest request) {
        User referee = actor(email, "REFEREE");
        RaceRegistration registration = getRegistration(registrationId);
        Race race = getRace(registration.getRaceId());
        if (!Objects.equals(race.getRefereeId(), referee.getId())) forbidden("Only the assigned referee can check this entry");
        String previousStatus = registration.getStatus();
        if (!Set.of("READY_FOR_CHECK", "APPROVED").contains(previousStatus)) {
            conflict("Registration is not ready for referee check");
        }
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        registration.setRefereeApproved(approved);
        registration.setHealthCheckStatus(request.getHealthCheckStatus() == null
                ? (approved ? "FIT" : "NOT_FIT") : request.getHealthCheckStatus());
        registration.setRefereeNotes(request.getNotes());
        registration.setStatus(approved ? "CLEARED_TO_RACE" : "REJECTED_BY_REFEREE");
        RaceRegistration saved = registrationRepository.save(registration);
        notifyPair(saved, "REFEREE_CHECK", "Referee check completed", "Entry status: " + saved.getStatus());
        audit(referee, "CHECK", "RACE_REGISTRATION", saved.getId(), previousStatus, saved.getStatus());
        return saved;
    }

    @Transactional
    public Race createRace(String email, Race race) {
        User admin = actor(email, "ADMIN");
        validateRaceConfiguration(race, null);
        race.setSurface("Turf");
        race.setRegistrationDeadline(LocalDateTime.of(race.getRaceDate(), race.getRaceTime()).minusWeeks(1));
        if (race.getStatus() == null || !ADMIN_RACE_STATUSES.contains(normalize(race.getStatus()))) race.setStatus("DRAFT");
        Race saved = raceRepository.save(race);
        audit(admin, "CREATE", "RACE", saved.getId(), null, saved.getStatus());
        return saved;
    }

    @Transactional
    public Race updateRace(String email, Long raceId, Race request) {
        User admin = actor(email, "ADMIN");
        Race existing = getRace(raceId);
        request.setStatus(existing.getStatus());
        validateRaceConfiguration(request, raceId);
        existing.setTournamentId(request.getTournamentId()); existing.setName(request.getName());
        existing.setType(request.getType()); existing.setDistanceM(request.getDistanceM()); existing.setSurface("Turf");
        existing.setRaceDate(request.getRaceDate()); existing.setRaceTime(request.getRaceTime());
        existing.setRegistrationDeadline(LocalDateTime.of(request.getRaceDate(), request.getRaceTime()).minusWeeks(1));
        existing.setMaxParticipants(request.getMaxParticipants()); existing.setPrizePool(request.getPrizePool());
        existing.setRefereeId(request.getRefereeId()); existing.setWeather(request.getWeather()); existing.setLocation(request.getLocation());
        Race saved = raceRepository.save(existing);
        audit(admin, "UPDATE", "RACE", saved.getId(), null, saved.getStatus());
        return saved;
    }

    @Transactional
    public Race adminUpdateStatus(String email, Long raceId, String requestedStatus) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        String next = requestedStatus == null ? "" : requestedStatus.toUpperCase(Locale.ROOT);
        if (!ADMIN_RACE_STATUSES.contains(next)) badRequest("Admin cannot set that race status directly");
        String before = race.getStatus();
        if ("STANDBY".equals(next)) {
            long cleared = clearedCount(raceId);
            if (cleared < 6) conflict("At least 6 cleared pairs are required for Standby");
            predictionRepository.findByRaceId(raceId).forEach(prediction -> prediction.setStatus("LOCKED"));
        }
        race.setStatus(next);
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(race, "RACE_STATUS", "Race status updated",
                race.getName() + " is now " + next.replace('_', ' ').toLowerCase(Locale.ROOT));
        audit(admin, "STATUS_CHANGE", "RACE", raceId, before, next);
        return saved;
    }

    @Transactional
    public Race startRace(String email, Long raceId) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) forbidden("Only the assigned referee can start this race");
        if (!"STANDBY".equals(race.getStatus())) conflict("Race must be in STANDBY before it can start");
        if (clearedCount(raceId) < 6) conflict("At least 6 cleared pairs are required to start a race");
        race.setStatus("IN_PROGRESS");
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(race, "RACE_STARTED", "Race started", race.getName() + " is now in progress");
        audit(referee, "START", "RACE", raceId, "STANDBY", "IN_PROGRESS");
        return saved;
    }

    @Transactional
    public Race completeRace(String email, Long raceId) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) forbidden("Only the assigned referee can complete this race");
        if (!"IN_PROGRESS".equals(race.getStatus())) conflict("Only an in-progress race can be completed");
        race.setStatus("COMPLETED");
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(race, "RACE_COMPLETED", "Provisional race completed",
                race.getName() + " awaits the referee report and Admin finalization");
        audit(referee, "COMPLETE", "RACE", raceId, "IN_PROGRESS", "COMPLETED");
        return saved;
    }

    public Map<String, Object> simulateRace(Long raceId, Integer durationSeconds) {
        Race race = getRace(raceId);
        if (!Set.of("IN_PROGRESS", "COMPLETED", "REPORT_READY", "OFFICIAL").contains(race.getStatus())) {
            conflict("Race simulation is unavailable in status " + race.getStatus());
        }
        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> "CLEARED_TO_RACE".equals(item.getStatus()))
                .toList();
        int duration = durationSeconds == null ? raceDuration(race.getType(), new Random()) : durationSeconds;
        Random random = new Random(raceId * 31 + duration);
        List<Map<String, Object>> lanes = registrations.stream().map(registration -> {
            Horse horse = horseRepository.findById(registration.getHorseId()).orElse(null);
            Map<String, Object> lane = new LinkedHashMap<>();
            lane.put("registrationId", registration.getId());
            lane.put("laneNumber", registration.getLaneNumber());
            lane.put("horseId", registration.getHorseId());
            lane.put("horseName", horse == null ? "Horse #" + registration.getHorseId() : horse.getHorseName());
            lane.put("jockeyId", registration.getJockeyId());
            lane.put("position", 35 + random.nextInt(66));
            lane.put("status", race.getStatus());
            return lane;
        }).sorted((a, b) -> Integer.compare((Integer) b.get("position"), (Integer) a.get("position"))).toList();
        return Map.of("raceId", raceId, "raceName", race.getName(), "durationSeconds", duration, "lanes", lanes);
    }

    @Transactional
    public RaceNote submitRaceReport(String email, Long raceId, RaceReportRequest request) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) forbidden("Only the assigned referee can submit this report");
        if (!"COMPLETED".equals(race.getStatus())) conflict("Race must be COMPLETED before report submission");
        RaceNote note = raceNoteRepository.save(RaceNote.builder()
                .raceId(raceId).refereeId(referee.getId()).noteCategory("RACE_REPORT")
                .severity(request.getSeverity() == null ? "INFO" : request.getSeverity())
                .description(request.getDescription()).actionTaken(request.getActionTaken()).build());
        race.setStatus("REPORT_READY");
        raceRepository.save(race);
        userRepository.findByRoleAndDeletedAtIsNull("ADMIN").stream().filter(this::isActive).forEach(admin ->
                notificationService.createIfAbsent(admin.getId(), "RACE_REPORT", "Race report ready",
                        race.getName() + " is ready for final review", "/dashboard"));
        audit(referee, "SUBMIT_REPORT", "RACE", raceId, "COMPLETED", "REPORT_READY");
        return note;
    }

    @Transactional
    public List<RaceResult> confirmResults(String email, Long raceId, ConfirmRaceResultsRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        if (!"REPORT_READY".equals(race.getStatus())) conflict("Referee report is required before Admin finalization");
        List<RaceResultRequest> items = request.getResults() == null ? List.of() : request.getResults();
        if (items.isEmpty()) badRequest("Result list is required");
        if (!resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId).isEmpty()) conflict("Race results were already recorded");
        Set<Long> registrationIds = new HashSet<>();
        Set<Integer> positions = new HashSet<>();
        List<RaceResult> saved = new ArrayList<>();
        for (RaceResultRequest item : items) {
            if (item.getRegistrationId() == null || item.getFinishPosition() == null || item.getFinishPosition() < 1) {
                badRequest("Each result requires a registration and positive finish position");
            }
            if (Boolean.TRUE.equals(item.getDisqualified())
                    && (item.getViolationNotes() == null || item.getViolationNotes().isBlank())) {
                badRequest("A written reason is mandatory for disqualification");
            }
            if (!registrationIds.add(item.getRegistrationId()) || !positions.add(item.getFinishPosition())) {
                conflict("Duplicate registration or finish position in result list");
            }
            RaceRegistration registration = getRegistration(item.getRegistrationId());
            if (!Objects.equals(registration.getRaceId(), raceId)) badRequest("Result registration belongs to another race");
            int points = Boolean.TRUE.equals(item.getDnf()) || Boolean.TRUE.equals(item.getDisqualified())
                    ? 0 : calculateRacePoints(item.getFinishPosition());
            RaceResult result = resultRepository.save(RaceResult.builder()
                    .raceId(raceId).registrationId(registration.getId()).horseId(registration.getHorseId())
                    .jockeyId(registration.getJockeyId()).ownerId(registration.getOwnerId())
                    .finishPosition(item.getFinishPosition())
                    .finishTimeSeconds(item.getFinishTimeSeconds() == null ? BigDecimal.ZERO : item.getFinishTimeSeconds())
                    .pointsAwarded(points).dnf(Boolean.TRUE.equals(item.getDnf()))
                    .disqualified(Boolean.TRUE.equals(item.getDisqualified()))
                    .violationNotes(item.getViolationNotes()).official(true).build());
            saved.add(result);
            applyStandingPoints(registration, item.getFinishPosition(), points);
            if (Boolean.TRUE.equals(item.getDisqualified())) {
                notifyPair(registration, "DISQUALIFICATION", "Entry disqualified", item.getViolationNotes());
            }
        }
        race.setStatus("OFFICIAL");
        raceRepository.save(race);
        distributePrizePool(race, saved);
        settlePredictions(race, saved);
        notifyRaceParticipants(race, "OFFICIAL_RESULTS", "Official results published",
                race.getName() + " has been finalized by Admin");
        registrationRepository.findByRaceId(raceId).forEach(this::dissolvePairing);
        audit(admin, "FINALIZE", "RACE", raceId, "REPORT_READY", "OFFICIAL");
        return resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
    }

    @Transactional
    public Prediction createPrediction(String email, Long raceId, PredictionRequest request) {
        User spectator = actor(email, "SPECTATOR");
        Race race = getRace(raceId);
        if (GUESS_LOCKED_STATUSES.contains(normalize(race.getStatus()))) conflict("Guesses are locked for this race");
        if (request.getPredictedHorseId() == null) badRequest("predictedHorseId is required");
        boolean eligible = registrationRepository.findByRaceId(raceId).stream()
                .anyMatch(entry -> Objects.equals(entry.getHorseId(), request.getPredictedHorseId())
                        && !"WITHDRAWN".equals(entry.getStatus()));
        if (!eligible) badRequest("Prediction must select a registered horse-jockey pair");

        Optional<Prediction> existing = predictionRepository.findFirstBySpectatorIdAndRaceId(spectator.getId(), raceId);
        Prediction prediction = existing.orElseGet(() -> Prediction.builder()
                .raceId(raceId).spectatorId(spectator.getId()).rewardPoints(0).build());
        prediction.setPredictedHorseId(request.getPredictedHorseId());
        prediction.setWagerPoints(0);
        prediction.setStatus("ACTIVE");
        Prediction saved = predictionRepository.save(prediction);
        notificationService.createIfAbsent(spectator.getId(), "PREDICTION_PLACED", "Guess recorded",
                "Your guess for " + race.getName() + " was recorded", "/races/" + raceId);
        audit(spectator, existing.isPresent() ? "UPDATE" : "CREATE", "PREDICTION", saved.getId(), null, "ACTIVE");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<JockeyInvitation> invitationsFor(String email, Long raceId) {
        User user = actor(email);
        List<JockeyInvitation> scoped = switch (user.getRole()) {
            case "ADMIN" -> invitationRepository.findAll();
            case "HORSE_OWNER" -> invitationRepository.findByOwnerId(user.getId());
            case "JOCKEY" -> invitationRepository.findByJockeyId(user.getId());
            default -> throw new ApiException(HttpStatus.FORBIDDEN, "Role cannot access invitations");
        };
        return raceId == null ? scoped : scoped.stream().filter(i -> Objects.equals(i.getRaceId(), raceId)).toList();
    }

    @Transactional(readOnly = true)
    public List<RaceRegistration> registrationsFor(String email, String status) {
        User user = actor(email);
        List<RaceRegistration> scoped = switch (user.getRole()) {
            case "ADMIN" -> registrationRepository.findAll();
            case "HORSE_OWNER" -> registrationRepository.findByOwnerId(user.getId());
            case "JOCKEY" -> registrationRepository.findByJockeyId(user.getId());
            case "REFEREE" -> registrationRepository.findAll().stream()
                    .filter(item -> Objects.equals(getRace(item.getRaceId()).getRefereeId(), user.getId())).toList();
            default -> throw new ApiException(HttpStatus.FORBIDDEN, "Role cannot access registrations");
        };
        return scoped.stream().filter(item -> item.getDeletedAt() == null)
                .filter(item -> status == null || status.isBlank() || status.equals(item.getStatus())).toList();
    }

    @Transactional(readOnly = true)
    public List<Prediction> predictionsFor(String email, Long raceId) {
        User user = actor(email);
        if ("ADMIN".equals(user.getRole())) return raceId == null ? predictionRepository.findAll() : predictionRepository.findByRaceId(raceId);
        if (!"SPECTATOR".equals(user.getRole())) forbidden("Role cannot access guesses");
        List<Prediction> mine = predictionRepository.findBySpectatorId(user.getId());
        return raceId == null ? mine : mine.stream().filter(p -> Objects.equals(p.getRaceId(), raceId)).toList();
    }

    public List<Map<String, Object>> horseLeaderboard() {
        return horseRepository.findAll().stream()
                .filter(horse -> horse.getDeletedAt() == null)
                .sorted(Comparator.comparing(Horse::getTotalPoints, Comparator.nullsFirst(Integer::compareTo)).reversed())
                .map(horse -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("horseId", horse.getId()); row.put("horseName", horse.getHorseName());
                    User owner = horse.getOwnerId() == null ? null : userRepository.findById(horse.getOwnerId()).orElse(null);
                    row.put("ownerId", horse.getOwnerId());
                    row.put("ownerName", owner == null ? "Unknown owner" : owner.getFullName());
                    row.put("totalRaces", value(horse.getTotalRaces()));
                    row.put("totalWins", value(horse.getTotalWins())); row.put("totalTop3", value(horse.getTotalTop3()));
                    row.put("totalPoints", value(horse.getTotalPoints())); return row;
                }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> jockeyLeaderboard() {
        Map<Long, IntSummaryStatistics> grouped = resultRepository.findAll().stream()
                .filter(result -> Boolean.TRUE.equals(result.getOfficial()) && result.getJockeyId() != null)
                .collect(Collectors.groupingBy(RaceResult::getJockeyId,
                        Collectors.summarizingInt(result -> value(result.getPointsAwarded()))));
        return grouped.entrySet().stream().sorted((a, b) -> Long.compare(b.getValue().getSum(), a.getValue().getSum()))
                .map(entry -> {
                    User jockey = userRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> row = new LinkedHashMap<>(); row.put("jockeyId", entry.getKey());
                    row.put("jockeyName", jockey == null ? "Jockey #" + entry.getKey() : jockey.getFullName());
                    row.put("totalRaces", entry.getValue().getCount()); row.put("totalPoints", entry.getValue().getSum()); return row;
                }).collect(Collectors.toList());
    }

    private void requireRegistrationOpen(Race race) {
        if (!"REGISTRATION_OPEN".equals(race.getStatus())) conflict("Race is not open for registration");
        if (race.getRaceDate() == null || race.getRaceTime() == null) badRequest("Race schedule is incomplete");
        LocalDateTime exactDeadline = LocalDateTime.of(race.getRaceDate(), race.getRaceTime()).minusWeeks(1);
        if (LocalDateTime.now().isAfter(exactDeadline) || LocalDateTime.now().isEqual(exactDeadline)) {
            conflict("Registration closed exactly one week before race start");
        }
    }

    private void validateRaceConfiguration(Race race, Long currentRaceId) {
        if (race.getName() == null || race.getName().isBlank() || race.getRaceDate() == null || race.getRaceTime() == null) {
            badRequest("Race name, date and time are required");
        }
        int participants = race.getMaxParticipants() == null ? 18 : race.getMaxParticipants();
        if (participants < 6 || participants > 18) badRequest("Race participants must be between 6 and 18");
        race.setMaxParticipants(participants);
        if (race.getPrizePool() != null && race.getPrizePool().signum() < 0) badRequest("Prize pool cannot be negative");
        if (race.getRefereeId() != null) {
            userRepository.findById(race.getRefereeId())
                    .filter(user -> user.getDeletedAt() == null && "REFEREE".equals(user.getRole()) && isActive(user))
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assigned referee is invalid"));
            boolean overlap = raceRepository.findByRefereeId(race.getRefereeId()).stream()
                    .filter(other -> currentRaceId == null || !Objects.equals(other.getId(), currentRaceId))
                    .filter(other -> other.getDeletedAt() == null && !"CANCELLED".equals(other.getStatus()))
                    .anyMatch(other -> Objects.equals(other.getRaceDate(), race.getRaceDate())
                            && other.getRaceTime() != null
                            && Math.abs(java.time.Duration.between(other.getRaceTime(), race.getRaceTime()).toMinutes()) < 5);
            if (overlap) conflict("Referee already has an overlapping race");
        }
    }

    private void enforceWithdrawalWindow(Race race) {
        LocalDateTime start = LocalDateTime.of(race.getRaceDate(), race.getRaceTime());
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(start.minusDays(3)) || now.isBefore(start.minusDays(7))) {
            conflict("Participant withdrawal is allowed only 3 to 7 days before the race; contact Admin otherwise");
        }
    }

    private long clearedCount(Long raceId) {
        return registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> "CLEARED_TO_RACE".equals(item.getStatus())).count();
    }

    private void dissolvePairing(RaceRegistration registration) {
        if (registration.getPairingContractId() == null) return;
        pairingRepository.findById(registration.getPairingContractId()).ifPresent(pairing -> {
            if (!"ACTIVE".equals(pairing.getStatus())) return;
            pairing.setStatus("DISSOLVED"); pairing.setDissolvedAt(LocalDateTime.now()); pairingRepository.save(pairing);
            horseRepository.findById(pairing.getHorseId()).ifPresent(horse -> {
                horse.setStatus("AVAILABLE"); horseRepository.save(horse);
            });
        });
    }

    private void notifyPair(RaceRegistration registration, String type, String title, String message) {
        String link = "/races/" + registration.getRaceId();
        notificationService.createIfAbsent(registration.getOwnerId(), type, title, message, link);
        notificationService.createIfAbsent(registration.getJockeyId(), type, title, message, link);
    }

    private void notifyRaceParticipants(Race race, String type, String title, String message) {
        Set<Long> recipients = new HashSet<>();
        if (race.getRefereeId() != null) recipients.add(race.getRefereeId());
        registrationRepository.findByRaceId(race.getId()).forEach(entry -> {
            if (entry.getOwnerId() != null) recipients.add(entry.getOwnerId());
            if (entry.getJockeyId() != null) recipients.add(entry.getJockeyId());
        });
        recipients.forEach(id -> notificationService.createIfAbsent(id, type, title, message, "/races/" + race.getId()));
    }

    private void distributePrizePool(Race race, List<RaceResult> results) {
        BigDecimal pool = race.getPrizePool() == null ? BigDecimal.ZERO : race.getPrizePool();
        BigDecimal first = pool.multiply(new BigDecimal("0.60")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal second = pool.multiply(new BigDecimal("0.30")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal third = pool.subtract(first).subtract(second);
        Map<Integer, BigDecimal> shares = Map.of(1, first, 2, second, 3, third);
        results.stream().filter(result -> shares.containsKey(result.getFinishPosition())).forEach(result ->
                notificationService.createIfAbsent(result.getOwnerId(), "PRIZE_ALLOCATION", "Prize allocation confirmed",
                        "Official " + result.getFinishPosition() + " place allocation: "
                                + shares.get(result.getFinishPosition()).toPlainString() + " points",
                        "/races/" + race.getId()));
    }

    private void settlePredictions(Race race, List<RaceResult> results) {
        Map<Long, Integer> finishes = results.stream().collect(Collectors.toMap(RaceResult::getHorseId, RaceResult::getFinishPosition));
        for (Prediction prediction : predictionRepository.findByRaceId(race.getId())) {
            int place = finishes.getOrDefault(prediction.getPredictedHorseId(), Integer.MAX_VALUE);
            String reward = switch (place) {
                case 1 -> "Horse goods package: image, merchandise link, and stable contact";
                case 2 -> "Voucher code: EQUIX-" + race.getId() + "-" + prediction.getId();
                case 3 -> "Complimentary drink coupon: DRINK-" + race.getId() + "-" + prediction.getId();
                default -> "No reward for this finishing position";
            };
            prediction.setStatus(place <= 3 ? "WON" : "LOST"); prediction.setRewardPoints(0);
            prediction.setSettledAt(LocalDateTime.now()); predictionRepository.save(prediction);
            notificationService.createIfAbsent(prediction.getSpectatorId(), "GUESS_RESULT", "Official guess result",
                    "Your selected pair finished " + (place == Integer.MAX_VALUE ? "outside the official order" : "#" + place) + ". " + reward,
                    "/races/" + race.getId());
        }
    }

    private void applyStandingPoints(RaceRegistration registration, int finishPosition, int points) {
        horseRepository.findById(registration.getHorseId()).ifPresent(horse -> {
            horse.setTotalRaces(value(horse.getTotalRaces()) + 1); horse.setTotalPoints(value(horse.getTotalPoints()) + points);
            if (points > 0 && finishPosition == 1) horse.setTotalWins(value(horse.getTotalWins()) + 1);
            if (points > 0 && finishPosition <= 3) horse.setTotalTop3(value(horse.getTotalTop3()) + 1);
            horseRepository.save(horse);
        });
    }

    private int calculateRacePoints(Integer finishPosition) {
        return finishPosition == null ? 0 : switch (finishPosition) {
            case 1 -> 10; case 2 -> 6; case 3 -> 4; case 4 -> 2; case 5 -> 1; default -> 0;
        };
    }

    private int raceDuration(String type, Random random) {
        String normalized = type == null ? "SPRINT" : type.toUpperCase(Locale.ROOT);
        int[] range = normalized.contains("LONG") ? new int[]{194, 198}
                : normalized.contains("MEDIUM") ? new int[]{117, 120}
                : normalized.contains("MILE") ? new int[]{90, 93} : new int[]{67, 69};
        return range[0] + random.nextInt(range[1] - range[0] + 1);
    }

    private User actor(String email, String... allowedRoles) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (!isActive(user)) forbidden("Account is not active");
        if (allowedRoles.length > 0 && Arrays.stream(allowedRoles).noneMatch(user.getRole()::equals)) forbidden("Role cannot perform this action");
        return user;
    }

    private boolean isActive(User user) { return Set.of("VERIFIED", "ACTIVE").contains(normalize(user.getStatus())); }
    private String normalize(String value) { return value == null ? "" : value.toUpperCase(Locale.ROOT); }
    private Race getRace(Long id) { return raceRepository.findById(id).filter(r -> r.getDeletedAt() == null)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race not found")); }
    private RaceRegistration getRegistration(Long id) { return registrationRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race registration not found")); }
    private int value(Integer number) { return number == null ? 0 : number; }

    private void audit(User user, String action, String entity, Long id, String before, String after) {
        auditLogRepository.save(AuditLog.builder().userId(user.getId()).userRole(user.getRole()).action(action)
                .entityType(entity).entityId(id).beforeValue(before).afterValue(after).build());
    }

    private void badRequest(String message) { throw new ApiException(HttpStatus.BAD_REQUEST, message); }
    private void conflict(String message) { throw new ApiException(HttpStatus.CONFLICT, message); }
    private void forbidden(String message) { throw new ApiException(HttpStatus.FORBIDDEN, message); }
}

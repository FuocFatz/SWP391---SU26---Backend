package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.realtime.RaceRealtimePublisher;
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
            "STANDBY", "IN_PROGRESS", "COMPLETED", "REPORT_READY", "REVISION_REQUIRED", "OFFICIAL", "CANCELLED");
    private static final Set<String> GUESS_OPEN_STATUSES = Set.of("REGISTRATION_OPEN", "REGISTRATION_CLOSED");
    private static final Set<String> GUESS_ELIGIBLE_ENTRY_STATUSES = Set.of(
            "READY_FOR_CHECK", "APPROVED", "CLEARED_TO_RACE");
    private static final Set<String> ADMIN_RACE_STATUSES = Set.of(
            "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED");
    private static final Set<String> DELETABLE_RACE_STATUSES = Set.of(
            "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "CANCELLED");
    private static final Map<String, Set<String>> ADMIN_RACE_STATUS_TRANSITIONS = Map.of(
            "DRAFT", Set.of("REGISTRATION_OPEN"),
            "REGISTRATION_OPEN", Set.of("DRAFT", "REGISTRATION_CLOSED"),
            "REGISTRATION_CLOSED", Set.of("REGISTRATION_OPEN"));
    private static final Set<String> DISQUALIFICATION_CATEGORIES = Set.of(
            "MEDICAL", "RULE_VIOLATION", "EQUIPMENT_FAILURE", "ADMINISTRATIVE", "OTHER");
    private static final Set<String> DISQUALIFICATION_SEVERITIES = Set.of("MINOR", "MAJOR", "CRITICAL");
    private static final Set<String> RACE_NOTE_CATEGORIES = Set.of(
            "START", "POSITION_CHANGE", "INCIDENT", "WEATHER", "EQUIPMENT", "INJURY", "INTERFERENCE", "OTHER");
    private static final Set<String> RACE_NOTE_SEVERITIES = Set.of("INFO", "WARNING", "CRITICAL");

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
    private final RewardService rewardService;
    private final RaceRealtimePublisher realtimePublisher;
    private final TournamentRepository tournamentRepository;

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
            AuditLogRepository auditLogRepository,
            RewardService rewardService,
            RaceRealtimePublisher realtimePublisher,
            TournamentRepository tournamentRepository) {
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
        this.rewardService = rewardService;
        this.realtimePublisher = realtimePublisher;
        this.tournamentRepository = tournamentRepository;
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
        ensureParticipantScheduleAvailable(race, horse.getId(), pairing.getJockeyId());

        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> item.getDeletedAt() == null && !"WITHDRAWN".equals(item.getStatus()))
                .toList();
        int nextLane = registrations.size() + 1;
        int limit = race.getMaxParticipants() == null ? 12 : race.getMaxParticipants();
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
    public List<RaceRegistration> approveRegistrations(String email, List<Long> registrationIds) {
        actor(email, "ADMIN");
        return registrationIds.stream().filter(Objects::nonNull).distinct()
                .map(registrationId -> approveRegistration(email, registrationId)).toList();
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
        userRepository.findByRoleAndDeletedAtIsNull("ADMIN").stream().filter(this::isActive).forEach(admin ->
                notificationService.createIfAbsent(admin.getId(), "REGISTRATION_WITHDRAWN", "Race entry withdrawn",
                        "Registration #" + saved.getId() + ": " + saved.getWithdrawReason(),
                        "/dashboard/registrations"));
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
        if (!approved) {
            String reason = request.getDisqualificationReason() == null
                    ? "" : request.getDisqualificationReason().trim();
            String category = normalize(request.getCategory());
            String severity = normalize(request.getSeverity());
            if (reason.length() < 20) {
                badRequest("Disqualification reason must contain at least 20 characters");
            }
            if (!DISQUALIFICATION_CATEGORIES.contains(category)) {
                badRequest("Disqualification category is invalid");
            }
            if (!DISQUALIFICATION_SEVERITIES.contains(severity)) {
                badRequest("Disqualification severity is invalid");
            }
            if (!"CONFIRM".equals(request.getConfirmationText())) {
                badRequest("Type CONFIRM to disqualify this entry");
            }
            registration.setDisqualificationReason(reason);
            registration.setDisqualificationCategory(category);
            registration.setDisqualificationSeverity(severity);
            registration.setDisqualifiedBy(referee.getId());
            registration.setDisqualifiedAt(LocalDateTime.now());
        } else {
            registration.setDisqualificationReason(null);
            registration.setDisqualificationCategory(null);
            registration.setDisqualificationSeverity(null);
            registration.setDisqualifiedBy(null);
            registration.setDisqualifiedAt(null);
        }
        registration.setRefereeApproved(approved);
        registration.setHealthCheckStatus(request.getHealthCheckStatus() == null
                ? (approved ? "FIT" : "NOT_FIT") : request.getHealthCheckStatus());
        registration.setRefereeNotes(request.getNotes());
        registration.setStatus(approved ? "CLEARED_TO_RACE" : "REJECTED_BY_REFEREE");
        RaceRegistration saved = registrationRepository.save(registration);
        if (!approved) dissolvePairing(saved);
        notifyPair(saved, "REFEREE_CHECK", "Referee check completed", "Entry status: " + saved.getStatus());
        audit(referee, "CHECK", "RACE_REGISTRATION", saved.getId(), previousStatus, saved.getStatus());
        return saved;
    }

    @Transactional
    public RaceRegistration markDnf(String email, Long registrationId, DnfRequest request) {
        User referee = actor(email, "REFEREE");
        RaceRegistration registration = getRegistration(registrationId);
        Race race = getRace(registration.getRaceId());
        if (!Objects.equals(race.getRefereeId(), referee.getId())) {
            forbidden("Only the assigned referee can mark this entry DNF");
        }
        if (!Set.of("IN_PROGRESS", "COMPLETED", "REVISION_REQUIRED").contains(normalize(race.getStatus()))) {
            conflict("DNF can only be recorded during or immediately after the race");
        }
        if (!Set.of("CLEARED_TO_RACE", "DNF").contains(normalize(registration.getStatus()))) {
            conflict("Only a cleared race entry can be marked DNF");
        }
        if (request.getReason() == null || request.getReason().trim().length() < 10) {
            badRequest("DNF reason must contain at least 10 characters");
        }
        if ("DNF".equals(normalize(registration.getStatus()))) return registration;
        registration.setStatus("DNF");
        registration.setDnfReason(request.getReason().trim());
        registration.setDnfBy(referee.getId());
        registration.setDnfAt(LocalDateTime.now());
        RaceRegistration saved = registrationRepository.save(registration);
        resultRepository.findByRaceIdAndRegistrationId(race.getId(), saved.getId()).ifPresent(result -> {
            result.setFinishPosition(null);
            result.setFinishTimeSeconds(null);
            result.setPointsAwarded(0);
            result.setDnf(true);
            result.setViolationNotes(request.getReason().trim());
            result.setOfficial(false);
            resultRepository.save(result);
        });
        horseRepository.findById(saved.getHorseId()).ifPresent(horse -> {
            horse.setStatus("UNAVAILABLE");
            horse.setHealthStatus("INJURED");
            horse.setInjuryNotes(request.getReason().trim());
            horseRepository.save(horse);
        });
        raceNoteRepository.save(RaceNote.builder().raceId(race.getId()).refereeId(referee.getId())
                .registrationId(saved.getId()).noteCategory("DNF").severity("CRITICAL")
                .description(request.getReason().trim()).actionTaken("Removed from active race tracking").build());
        notifyPair(saved, "RACE_DNF", "Entry marked Did Not Finish", request.getReason().trim());
        audit(referee, "MARK_DNF", "RACE_REGISTRATION", saved.getId(), "CLEARED_TO_RACE", "DNF");
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
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public Race updateRace(String email, Long raceId, Race request) {
        User admin = actor(email, "ADMIN");
        Race existing = getRace(raceId);
        boolean hasRegistrations = registrationRepository.findByRaceId(raceId).stream()
                .anyMatch(entry -> entry.getDeletedAt() == null
                        && !Set.of("WITHDRAWN", "CANCELLED").contains(normalize(entry.getStatus())));
        if (hasRegistrations && (!Objects.equals(existing.getRaceDate(), request.getRaceDate())
                || !Objects.equals(existing.getRaceTime(), request.getRaceTime()))) {
            conflict("Use the reschedule action to change the schedule after registrations exist");
        }
        if (hasRegistrations && (!Objects.equals(normalize(existing.getType()), normalize(request.getType()))
                || !Objects.equals(existing.getDistanceM(), request.getDistanceM())
                || !Objects.equals(existing.getMaxParticipants(), request.getMaxParticipants())
                || !Objects.equals(existing.getTournamentId(), request.getTournamentId()))) {
            conflict("Race type, distance, capacity, and tournament cannot change after registration begins");
        }
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
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public void deleteRace(String email, Long raceId) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        String status = normalize(race.getStatus());
        if (!DELETABLE_RACE_STATUSES.contains(status)) {
            conflict("Only a pre-start or cancelled race can be deleted");
        }

        boolean hasRelatedActivity = registrationRepository.findByRaceId(raceId).stream()
                .anyMatch(entry -> entry.getDeletedAt() == null)
                || !invitationRepository.findByRaceId(raceId).isEmpty()
                || !predictionRepository.findByRaceId(raceId).isEmpty()
                || !resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId).isEmpty()
                || !raceNoteRepository.findByRaceIdOrderByCreatedAtAsc(raceId).isEmpty();
        if (hasRelatedActivity) {
            conflict("Race already has registrations or related activity; cancel it instead to preserve history");
        }

        race.setDeletedAt(LocalDateTime.now());
        raceRepository.save(race);
        audit(admin, "DELETE", "RACE", raceId, status, "DELETED");
    }

    @Transactional
    public Race adminUpdateStatus(String email, Long raceId, String requestedStatus) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        String next = requestedStatus == null ? "" : requestedStatus.toUpperCase(Locale.ROOT);
        if (!ADMIN_RACE_STATUSES.contains(next)) badRequest("Admin cannot change a race directly to that status");
        String before = normalize(race.getStatus());
        if (before.equals(next)) return race;
        if (!ADMIN_RACE_STATUS_TRANSITIONS.getOrDefault(before, Set.of()).contains(next)) {
            conflict("Race status cannot change from " + before + " to " + next);
        }
        if ("REGISTRATION_OPEN".equals(next)) {
            LocalDateTime deadline = race.getRegistrationDeadline();
            if (deadline != null && !deadline.isAfter(LocalDateTime.now())) {
                conflict("Registration deadline has passed; reschedule the race before reopening registration");
            }
        }
        if (!GUESS_LOCKED_STATUSES.contains(next)) {
            predictionRepository.findByRaceId(raceId).stream()
                    .filter(prediction -> "LOCKED".equals(normalize(prediction.getStatus())))
                    .forEach(prediction -> prediction.setStatus("ACTIVE"));
        }
        race.setStatus(next);
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(race, "RACE_STATUS", "Race status updated",
                race.getName() + " is now " + next.replace('_', ' ').toLowerCase(Locale.ROOT));
        audit(admin, "STATUS_CHANGE", "RACE", raceId, before, next);
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public Race prepareRace(String email, Long raceId) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) {
            forbidden("Only the assigned referee can prepare this race");
        }
        if (!"REGISTRATION_CLOSED".equals(normalize(race.getStatus()))) {
            conflict("Registration must be closed before the referee can prepare the race");
        }
        if (clearedCount(raceId) < 6) conflict("At least 6 cleared pairs are required for Standby");
        predictionRepository.findByRaceId(raceId).forEach(prediction -> {
            prediction.setStatus("LOCKED");
            predictionRepository.save(prediction);
        });
        race.setStatus("STANDBY");
        race.setAdminReviewRequired(false);
        race.setReviewReason(null);
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(saved, "RACE_READY", "Race ready to start",
                saved.getName() + " has passed pre-race checks and is now on standby");
        audit(referee, "PREPARE", "RACE", raceId, "REGISTRATION_CLOSED", "STANDBY");
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public int closeExpiredRegistrations() {
        LocalDateTime now = LocalDateTime.now();
        int closed = 0;
        for (Race race : raceRepository.findByStatus("REGISTRATION_OPEN")) {
            if (race.getDeletedAt() != null || race.getRegistrationDeadline() == null
                    || race.getRegistrationDeadline().isAfter(now)) continue;
            long activeEntries = registrationRepository.findByRaceId(race.getId()).stream()
                    .filter(entry -> entry.getDeletedAt() == null)
                    .filter(entry -> !Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE")
                            .contains(normalize(entry.getStatus())))
                    .count();
            race.setStatus("REGISTRATION_CLOSED");
            boolean requiresReview = activeEntries < 6;
            race.setAdminReviewRequired(requiresReview);
            race.setReviewReason(requiresReview
                    ? "Registration closed with only " + activeEntries + " active pair(s); minimum is 6"
                    : null);
            Race saved = raceRepository.save(race);
            if (requiresReview) {
                userRepository.findByRoleAndDeletedAtIsNull("ADMIN").stream().filter(this::isActive).forEach(admin ->
                        notificationService.createIfAbsent(admin.getId(), "RACE_REVIEW_REQUIRED",
                                "Race requires Admin review", saved.getReviewReason(), "/dashboard/races"));
            }
            auditLogRepository.save(AuditLog.builder().userRole("SYSTEM").action("AUTO_CLOSE_REGISTRATION")
                    .entityType("RACE").entityId(race.getId()).beforeValue("REGISTRATION_OPEN")
                    .afterValue("REGISTRATION_CLOSED" + (requiresReview ? ": REVIEW_REQUIRED" : "")).build());
            realtimePublisher.publishRaceState(saved);
            closed++;
        }
        return closed;
    }

    @Transactional
    public Race cancelRace(String email, Long raceId, CancelRaceRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        String current = normalize(race.getStatus());
        if (Set.of("IN_PROGRESS", "COMPLETED", "REPORT_READY", "REVISION_REQUIRED", "OFFICIAL").contains(current)) {
            conflict("A race cannot be cancelled after it has started");
        }
        if ("CANCELLED".equals(current)) conflict("Race is already cancelled");

        String reason = request.getReason().trim();
        LocalDateTime now = LocalDateTime.now();
        List<RaceRegistration> affectedRegistrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> item.getDeletedAt() == null)
                .filter(item -> !Set.of("WITHDRAWN", "CANCELLED").contains(normalize(item.getStatus())))
                .toList();

        affectedRegistrations.forEach(registration -> {
            registration.setStatus("CANCELLED");
            registration.setWithdrawReason("Race cancelled by Admin: " + reason);
            registrationRepository.save(registration);
            releasePairingIfUnused(registration, raceId, now);
        });
        invitationRepository.findByRaceId(raceId).stream()
                .filter(invitation -> !Set.of("DECLINED", "CANCELLED").contains(normalize(invitation.getStatus())))
                .forEach(invitation -> {
                    invitation.setStatus("CANCELLED");
                    invitation.setResponseNote("Race cancelled by Admin: " + reason);
                    invitation.setRespondedAt(now);
                    invitationRepository.save(invitation);
                });
        predictionRepository.findByRaceId(raceId).forEach(prediction -> {
            if (!"VOIDED".equals(normalize(prediction.getStatus())) && value(prediction.getWagerPoints()) > 0) {
                userRepository.findByIdAndDeletedAtIsNull(prediction.getSpectatorId()).ifPresent(spectator -> {
                    spectator.setRewardPoints(value(spectator.getRewardPoints()) + value(prediction.getWagerPoints()));
                    userRepository.save(spectator);
                });
            }
            prediction.setStatus("VOIDED");
            prediction.setRewardPoints(0);
            prediction.setSettledAt(now);
            predictionRepository.save(prediction);
        });

        String before = race.getStatus();
        race.setStatus("CANCELLED");
        race.setCancellationReason(reason);
        race.setCancelledAt(now);
        Race saved = raceRepository.save(race);
        notifyRaceParticipants(saved, "RACE_CANCELLED", "Race cancelled: " + saved.getName(),
                reason + ". Registrations and guesses have been voided.");
        notifySpectatorsForRace(saved, "RACE_CANCELLED", "Race cancelled: " + saved.getName(),
                reason + ". Your guess has been voided.");
        audit(admin, "CANCEL", "RACE", raceId, before, "CANCELLED: " + reason);
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public Race rescheduleRace(String email, Long raceId, RescheduleRaceRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        String current = normalize(race.getStatus());
        if (Set.of("IN_PROGRESS", "COMPLETED", "REPORT_READY", "REVISION_REQUIRED", "OFFICIAL").contains(current)) {
            conflict("A race cannot be rescheduled after it has started");
        }
        LocalDateTime scheduledAt = request.getScheduledAt();
        if (!scheduledAt.isAfter(LocalDateTime.now())) badRequest("New race date and time must be in the future");
        Race proposed = Race.builder().id(race.getId()).tournamentId(race.getTournamentId()).name(race.getName())
                .type(race.getType()).distanceM(race.getDistanceM()).surface("Turf")
                .raceDate(scheduledAt.toLocalDate()).raceTime(scheduledAt.toLocalTime().withSecond(0).withNano(0))
                .maxParticipants(race.getMaxParticipants()).prizePool(race.getPrizePool())
                .refereeId(race.getRefereeId()).weather(race.getWeather()).location(race.getLocation())
                .status(race.getStatus()).build();
        validateRaceConfiguration(proposed, raceId);
        for (RaceRegistration entry : registrationRepository.findByRaceId(raceId)) {
            if (entry.getDeletedAt() != null || Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE")
                    .contains(normalize(entry.getStatus()))) continue;
            boolean horseConflict = registrationRepository.findByHorseId(entry.getHorseId()).stream()
                    .anyMatch(other -> !Objects.equals(other.getRaceId(), raceId)
                            && activeRegistrationOverlaps(other, proposed));
            boolean jockeyConflict = registrationRepository.findByJockeyId(entry.getJockeyId()).stream()
                    .anyMatch(other -> !Objects.equals(other.getRaceId(), raceId)
                            && activeRegistrationOverlaps(other, proposed));
            if (horseConflict || jockeyConflict) {
                conflict("New schedule overlaps another race commitment for a registered horse or jockey");
            }
        }

        String before = race.getRaceDate() + " " + race.getRaceTime() + " (" + race.getStatus() + ")";
        race.setRaceDate(scheduledAt.toLocalDate());
        race.setRaceTime(scheduledAt.toLocalTime().withSecond(0).withNano(0));
        race.setRegistrationDeadline(scheduledAt.minusWeeks(1));
        race.setRescheduleReason(request.getReason().trim());
        race.setRescheduledAt(LocalDateTime.now());
        if ("CANCELLED".equals(current)) {
            race.setStatus(scheduledAt.minusWeeks(1).isAfter(LocalDateTime.now())
                    ? "REGISTRATION_OPEN" : "REGISTRATION_CLOSED");
        }
        Race saved = raceRepository.save(race);
        String readableTime = saved.getRaceDate() + " " + saved.getRaceTime();
        notifyRaceParticipants(saved, "RACE_RESCHEDULED", "Race rescheduled to " + readableTime,
                saved.getName() + ": " + request.getReason().trim());
        notifySpectatorsForRace(saved, "RACE_RESCHEDULED", "Race rescheduled to " + readableTime,
                saved.getName() + ": " + request.getReason().trim());
        audit(admin, "RESCHEDULE", "RACE", raceId, before,
                readableTime + " (" + saved.getStatus() + "): " + request.getReason().trim());
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional
    public Race reassignReferee(String email, Long raceId, ReassignRefereeRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        if (Set.of("IN_PROGRESS", "COMPLETED", "REPORT_READY", "REVISION_REQUIRED", "OFFICIAL", "CANCELLED")
                .contains(normalize(race.getStatus()))) {
            conflict("Referee cannot be reassigned after the race starts or is cancelled");
        }
        if (request.getReason() == null || request.getReason().trim().length() < 20) {
            badRequest("Referee reassignment reason must contain at least 20 characters");
        }
        Long previousRefereeId = race.getRefereeId();
        if (Objects.equals(previousRefereeId, request.getRefereeId())) {
            conflict("Select a different referee");
        }
        Race proposed = Race.builder().id(race.getId()).tournamentId(race.getTournamentId()).name(race.getName())
                .type(race.getType()).distanceM(race.getDistanceM()).raceDate(race.getRaceDate())
                .raceTime(race.getRaceTime()).maxParticipants(race.getMaxParticipants())
                .prizePool(race.getPrizePool()).refereeId(request.getRefereeId()).build();
        validateRaceConfiguration(proposed, raceId);
        race.setRefereeId(request.getRefereeId());
        Race saved = raceRepository.save(race);
        notificationService.createIfAbsent(previousRefereeId, "REFEREE_REASSIGNED", "Race assignment changed",
                race.getName() + ": " + request.getReason().trim(), "/dashboard/assigned-races");
        notificationService.createIfAbsent(request.getRefereeId(), "REFEREE_ASSIGNED", "New race assignment",
                race.getName() + ": " + request.getReason().trim(), "/dashboard/assigned-races");
        audit(admin, "REASSIGN_REFEREE", "RACE", raceId, String.valueOf(previousRefereeId),
                request.getRefereeId() + ": " + request.getReason().trim());
        realtimePublisher.publishRaceState(saved);
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
        realtimePublisher.publishRaceState(saved);
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
        createProvisionalResults(saved);
        notifyRaceParticipants(race, "RACE_COMPLETED", "Provisional race completed",
                race.getName() + " awaits the referee report and Admin finalization");
        audit(referee, "COMPLETE", "RACE", raceId, "IN_PROGRESS", "COMPLETED");
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    private void createProvisionalResults(Race race) {
        if (!resultRepository.findByRaceIdOrderByFinishPositionAsc(race.getId()).isEmpty()) return;
        Map<String, Object> simulation = simulateRace(race.getId(), null);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lanes = (List<Map<String, Object>>) simulation.getOrDefault("lanes", List.of());
        int duration = ((Number) simulation.getOrDefault("durationSeconds", 0)).intValue();
        int position = 1;
        for (Map<String, Object> lane : lanes) {
            Long registrationId = ((Number) lane.get("registrationId")).longValue();
            RaceRegistration registration = getRegistration(registrationId);
            resultRepository.save(RaceResult.builder()
                    .raceId(race.getId()).registrationId(registrationId)
                    .horseId(registration.getHorseId()).jockeyId(registration.getJockeyId())
                    .ownerId(registration.getOwnerId()).finishPosition(position)
                    .finishTimeSeconds(BigDecimal.valueOf(duration).add(BigDecimal.valueOf(position, 2)))
                    .pointsAwarded(0).dnf(false).disqualified(false).official(false).build());
            position++;
        }
        registrationRepository.findByRaceId(race.getId()).stream()
                .filter(registration -> "DNF".equals(normalize(registration.getStatus())))
                .forEach(registration -> resultRepository.save(RaceResult.builder()
                        .raceId(race.getId()).registrationId(registration.getId())
                        .horseId(registration.getHorseId()).jockeyId(registration.getJockeyId())
                        .ownerId(registration.getOwnerId()).finishPosition(null).finishTimeSeconds(null)
                        .pointsAwarded(0).dnf(true).disqualified(false)
                        .violationNotes(registration.getDnfReason()).official(false).build()));
    }

    public Map<String, Object> simulateRaceForReferee(String email, Long raceId, Integer durationSeconds) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) {
            forbidden("Only the assigned referee can simulate this race");
        }
        return simulateRace(raceId, durationSeconds);
    }

    public Map<String, Object> simulateRace(Long raceId, Integer durationSeconds) {
        Race race = getRace(raceId);
        if (!Set.of("IN_PROGRESS", "COMPLETED", "REPORT_READY", "REVISION_REQUIRED", "OFFICIAL").contains(race.getStatus())) {
            conflict("Race simulation is unavailable in status " + race.getStatus());
        }
        List<RaceRegistration> registrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(item -> "CLEARED_TO_RACE".equals(item.getStatus()))
                .toList();
        int duration = durationSeconds == null ? raceDuration(race.getType(), new Random(raceId)) : durationSeconds;
        long elapsed = "IN_PROGRESS".equals(race.getStatus()) && race.getUpdatedAt() != null
                ? Math.max(0, java.time.Duration.between(race.getUpdatedAt(), LocalDateTime.now()).toSeconds()) : duration;
        double baseProgress = Math.min(100, elapsed * 100.0 / Math.max(duration, 1));
        Random random = new Random(raceId * 31 + Math.max(1, elapsed));
        List<Map<String, Object>> lanes = registrations.stream().map(registration -> {
            Horse horse = horseRepository.findById(registration.getHorseId()).orElse(null);
            Map<String, Object> lane = new LinkedHashMap<>();
            lane.put("registrationId", registration.getId());
            lane.put("laneNumber", registration.getLaneNumber());
            lane.put("horseId", registration.getHorseId());
            lane.put("horseName", horse == null ? "Horse #" + registration.getHorseId() : horse.getHorseName());
            lane.put("jockeyId", registration.getJockeyId());
            double jitter = random.nextDouble() * 12 - 6;
            lane.put("position", (int) Math.max(0, Math.min(100, Math.round(baseProgress + jitter))));
            lane.put("status", race.getStatus());
            return lane;
        }).sorted((a, b) -> Integer.compare((Integer) b.get("position"), (Integer) a.get("position"))).toList();
        Map<String, Object> simulation = Map.of(
                "raceId", raceId,
                "raceName", race.getName(),
                "durationSeconds", duration,
                "elapsedSeconds", Math.min(elapsed, duration),
                "remainingSeconds", Math.max(0, duration - elapsed),
                "lanes", lanes);
        realtimePublisher.publishSimulation(simulation);
        return simulation;
    }

    @Transactional
    public RaceNote submitRaceReport(String email, Long raceId, RaceReportRequest request) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) forbidden("Only the assigned referee can submit this report");
        String before = normalize(race.getStatus());
        if (!Set.of("COMPLETED", "REVISION_REQUIRED").contains(before)) {
            conflict("Race must be completed or awaiting a revised report");
        }
        if (request.getDescription() == null || request.getDescription().trim().length() < 20) {
            badRequest("Race report must contain at least 20 characters");
        }
        if (!Boolean.TRUE.equals(request.getReviewedIncidents())) {
            badRequest("All incidents and race notes must be reviewed before report submission");
        }
        if (request.getSignature() == null || request.getSignature().isBlank()) {
            badRequest("Referee signature is required");
        }
        int revision = (int) raceNoteRepository.findByRaceIdOrderByCreatedAtAsc(raceId).stream()
                .filter(note -> "RACE_REPORT".equals(normalize(note.getNoteCategory()))).count() + 1;
        String severity = normalizeRaceNoteSeverity(request.getSeverity());
        RaceNote note = raceNoteRepository.save(RaceNote.builder()
                .raceId(raceId).refereeId(referee.getId()).noteCategory("RACE_REPORT")
                .severity(severity)
                .description(request.getDescription().trim()).actionTaken(request.getActionTaken())
                .signature(request.getSignature().trim()).reviewedIncidents(true).revisionNumber(revision).build());
        race.setStatus("REPORT_READY");
        raceRepository.save(race);
        userRepository.findByRoleAndDeletedAtIsNull("ADMIN").stream().filter(this::isActive).forEach(admin ->
                notificationService.createIfAbsent(admin.getId(), "RACE_REPORT", "Race report ready",
                        race.getName() + " is ready for final review", "/dashboard"));
        audit(referee, "SUBMIT_REPORT", "RACE", raceId, before, "REPORT_READY revision " + revision);
        realtimePublisher.publishRaceState(race);
        return note;
    }

    @Transactional
    public RaceNote addRaceIncident(String email, Long raceId, RaceIncidentNoteRequest request) {
        User referee = actor(email, "REFEREE");
        Race race = getRace(raceId);
        if (!Objects.equals(race.getRefereeId(), referee.getId())) {
            forbidden("Only the assigned referee can record incidents for this race");
        }
        if (!Set.of("IN_PROGRESS", "COMPLETED", "REVISION_REQUIRED").contains(normalize(race.getStatus()))) {
            conflict("Incidents can only be recorded during or after the race");
        }
        String category = normalizeRaceNoteCategory(request.getCategory());
        String severity = normalizeRaceNoteSeverity(request.getSeverity());
        if (request.getRegistrationId() != null) {
            RaceRegistration entry = getRegistration(request.getRegistrationId());
            if (!Objects.equals(entry.getRaceId(), raceId)) badRequest("Incident entry belongs to another race");
        }
        RaceNote note = raceNoteRepository.save(RaceNote.builder()
                .raceId(raceId).refereeId(referee.getId()).registrationId(request.getRegistrationId())
                .noteCategory(category).severity(severity)
                .description(request.getDescription().trim()).actionTaken(request.getActionTaken())
                .raceTimeSeconds(request.getRaceTimeSeconds()).build());
        audit(referee, "CREATE", "RACE_INCIDENT", note.getId(), null, severity);
        return note;
    }

    @Transactional
    public Race requestReportRevision(String email, Long raceId, AdminReportRevisionRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        if (!"REPORT_READY".equals(normalize(race.getStatus()))) {
            conflict("Only a submitted referee report can be returned for revision");
        }
        if (request.getReason() == null || request.getReason().trim().length() < 20) {
            badRequest("Report revision reason must contain at least 20 characters");
        }
        raceNoteRepository.save(RaceNote.builder()
                .raceId(raceId).refereeId(admin.getId()).noteCategory("REVISION_REQUEST")
                .severity("WARNING").description(request.getReason().trim()).build());
        race.setStatus("REVISION_REQUIRED");
        Race saved = raceRepository.save(race);
        notificationService.createIfAbsent(race.getRefereeId(), "REPORT_REVISION", "Race report revision required",
                request.getReason().trim(), "/dashboard/monitor");
        audit(admin, "REQUEST_REVISION", "RACE", raceId, "REPORT_READY", request.getReason().trim());
        realtimePublisher.publishRaceState(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<RaceNote> raceNotesFor(String email, Long raceId) {
        User user = actor(email);
        Race race = getRace(raceId);
        if (!"ADMIN".equals(user.getRole())
                && !("REFEREE".equals(user.getRole()) && Objects.equals(race.getRefereeId(), user.getId()))) {
            forbidden("Only Admin or the assigned referee can view race notes");
        }
        return raceNoteRepository.findByRaceIdOrderByCreatedAtAsc(raceId);
    }

    @Transactional
    public List<RaceResult> confirmResults(String email, Long raceId, ConfirmRaceResultsRequest request) {
        User admin = actor(email, "ADMIN");
        Race race = getRace(raceId);
        if (!"REPORT_READY".equals(race.getStatus())) conflict("Referee report is required before Admin finalization");
        List<RaceResultRequest> items = request.getResults() == null ? List.of() : request.getResults();
        if (items.isEmpty()) badRequest("Result list is required");
        List<RaceResult> existingResults = resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
        if (existingResults.stream().anyMatch(result -> Boolean.TRUE.equals(result.getOfficial()))) {
            conflict("Race results were already finalized");
        }
        Set<Long> expectedRegistrations = registrationRepository.findByRaceId(raceId).stream()
                .filter(entry -> Set.of("CLEARED_TO_RACE", "DNF").contains(normalize(entry.getStatus())))
                .map(RaceRegistration::getId).collect(Collectors.toSet());
        Set<Long> submittedRegistrations = items.stream().map(RaceResultRequest::getRegistrationId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        if (!expectedRegistrations.equals(submittedRegistrations)) {
            badRequest("Official results must include every cleared race entry exactly once");
        }
        Set<Long> registrationIds = new HashSet<>();
        List<RaceResult> saved = new ArrayList<>();
        for (RaceResultRequest item : items) {
            if (item.getRegistrationId() == null) {
                badRequest("Each result requires a registration");
            }
            boolean noNumericPosition = Boolean.TRUE.equals(item.getDnf()) || Boolean.TRUE.equals(item.getDisqualified());
            if (!noNumericPosition && (item.getFinishPosition() == null || item.getFinishPosition() < 1)) {
                badRequest("Each completed result requires a positive finish position");
            }
            if (Boolean.TRUE.equals(item.getDisqualified())
                    && (item.getViolationNotes() == null || item.getViolationNotes().trim().length() < 20)) {
                badRequest("A disqualification reason of at least 20 characters is mandatory");
            }
            if (!registrationIds.add(item.getRegistrationId())) {
                conflict("Duplicate registration in result list");
            }
            RaceRegistration registration = getRegistration(item.getRegistrationId());
            if (!Objects.equals(registration.getRaceId(), raceId)) badRequest("Result registration belongs to another race");
            int points = Boolean.TRUE.equals(item.getDnf()) || Boolean.TRUE.equals(item.getDisqualified())
                    ? 0 : calculateRacePoints(item.getFinishPosition());
            RaceResult result = resultRepository.findByRaceIdAndRegistrationId(raceId, registration.getId())
                    .orElseGet(() -> RaceResult.builder().raceId(raceId).registrationId(registration.getId())
                            .horseId(registration.getHorseId()).jockeyId(registration.getJockeyId())
                            .ownerId(registration.getOwnerId()).build());
            result.setFinishPosition(item.getFinishPosition());
            result.setFinishTimeSeconds(noNumericPosition ? null
                    : (item.getFinishTimeSeconds() == null ? BigDecimal.ZERO : item.getFinishTimeSeconds()));
            result.setPointsAwarded(points);
            result.setDnf(Boolean.TRUE.equals(item.getDnf()));
            result.setDisqualified(Boolean.TRUE.equals(item.getDisqualified()));
            result.setViolationNotes(item.getViolationNotes());
            result.setOfficial(true);
            result = resultRepository.save(result);
            saved.add(result);
            applyStandingPoints(registration, item.getFinishPosition(), points);
            if (Boolean.TRUE.equals(item.getDisqualified())) {
                notifyPair(registration, "DISQUALIFICATION", "Entry disqualified", item.getViolationNotes());
            }
            if (Boolean.TRUE.equals(item.getDnf())) {
                horseRepository.findById(registration.getHorseId()).ifPresent(horse -> {
                    horse.setStatus("UNAVAILABLE");
                    horse.setHealthStatus("INJURED");
                    horse.setInjuryNotes(item.getViolationNotes());
                    horseRepository.save(horse);
                });
                notifyPair(registration, "RACE_DNF", "Official result: Did Not Finish",
                        item.getViolationNotes() == null ? "DNF confirmed by Admin" : item.getViolationNotes());
            }
        }
        race.setStatus("OFFICIAL");
        raceRepository.save(race);
        distributePrizePool(race, saved);
        settlePredictions(admin, race, saved);
        notifyRaceParticipants(race, "OFFICIAL_RESULTS", "Official results published",
                race.getName() + " has been finalized by Admin");
        realtimePublisher.publishRaceState(race);
        registrationRepository.findByRaceId(raceId).forEach(this::dissolvePairing);
        audit(admin, "FINALIZE", "RACE", raceId, "REPORT_READY", "OFFICIAL");
        return resultRepository.findByRaceIdOrderByFinishPositionAsc(raceId);
    }

    @Transactional
    public Prediction createPrediction(String email, Long raceId, PredictionRequest request) {
        User spectator = actor(email, "SPECTATOR");
        Race race = getRace(raceId);
        if (!GUESS_OPEN_STATUSES.contains(normalize(race.getStatus()))) conflict("Guesses are locked for this race");
        if (request.getPredictedHorseId() == null) badRequest("predictedHorseId is required");
        boolean eligible = registrationRepository.findByRaceId(raceId).stream()
                .anyMatch(entry -> Objects.equals(entry.getHorseId(), request.getPredictedHorseId())
                        && GUESS_ELIGIBLE_ENTRY_STATUSES.contains(normalize(entry.getStatus())));
        if (!eligible) badRequest("Prediction must select an Admin-approved horse-jockey pair");

        Optional<Prediction> existing = predictionRepository.findFirstBySpectatorIdAndRaceId(spectator.getId(), raceId);
        int wagerPoints = request.getWagerPoints() == null ? 0 : request.getWagerPoints();
        if (wagerPoints < 0 || wagerPoints > 100000) {
            badRequest("wagerPoints must be between 0 and 100000");
        }
        int previousWager = existing.map(Prediction::getWagerPoints).map(this::value).orElse(0);
        int availablePoints = value(spectator.getRewardPoints()) + previousWager;
        if (wagerPoints > availablePoints) {
            conflict("Insufficient reward points. Available balance: " + availablePoints);
        }
        Prediction prediction = existing.orElseGet(() -> Prediction.builder()
                .raceId(raceId).spectatorId(spectator.getId()).rewardPoints(0).build());
        prediction.setPredictedHorseId(request.getPredictedHorseId());
        prediction.setWagerPoints(wagerPoints);
        prediction.setStatus("ACTIVE");
        prediction.setRewardPoints(0);
        prediction.setSettledAt(null);
        spectator.setRewardPoints(availablePoints - wagerPoints);
        userRepository.save(spectator);
        Prediction saved = predictionRepository.save(prediction);
        notificationService.createIfAbsent(spectator.getId(), "PREDICTION_PLACED", "Guess recorded",
                "Your guess for " + race.getName() + " was recorded with " + wagerPoints + " point(s)",
                "/races/" + raceId);
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
        Map<Long, List<RaceResult>> officialByHorse = resultRepository.findAll().stream()
                .filter(result -> Boolean.TRUE.equals(result.getOfficial()))
                .filter(result -> !Boolean.TRUE.equals(result.getDnf()) && !Boolean.TRUE.equals(result.getDisqualified()))
                .collect(Collectors.groupingBy(RaceResult::getHorseId));
        return horseRepository.findAll().stream()
                .filter(horse -> horse.getDeletedAt() == null)
                .sorted(Comparator.comparing((Horse horse) -> value(horse.getTotalPoints())).reversed()
                        .thenComparing(Comparator.comparing((Horse horse) -> value(horse.getTotalWins())).reversed())
                        .thenComparing((Horse horse) -> placementCount(officialByHorse.get(horse.getId()), 2), Comparator.reverseOrder())
                        .thenComparing((Horse horse) -> placementCount(officialByHorse.get(horse.getId()), 3), Comparator.reverseOrder())
                        .thenComparing(Comparator.comparing((Horse horse) -> value(horse.getTotalRaces())).reversed())
                        .thenComparing(Horse::getId))
                .map(horse -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("horseId", horse.getId()); row.put("horseName", horse.getHorseName());
                    row.put("horseImageUrl", horse.getImageUrl());
                    User owner = horse.getOwnerId() == null ? null : userRepository.findById(horse.getOwnerId()).orElse(null);
                    row.put("ownerId", horse.getOwnerId());
                    row.put("ownerName", owner == null ? "Unknown owner" : owner.getFullName());
                    row.put("totalRaces", value(horse.getTotalRaces()));
                    row.put("totalWins", value(horse.getTotalWins())); row.put("totalTop3", value(horse.getTotalTop3()));
                    row.put("secondPlaces", placementCount(officialByHorse.get(horse.getId()), 2));
                    row.put("thirdPlaces", placementCount(officialByHorse.get(horse.getId()), 3));
                    row.put("totalPoints", value(horse.getTotalPoints())); return row;
                }).collect(Collectors.toList());
    }

    private int placementCount(List<RaceResult> results, int position) {
        if (results == null) return 0;
        return (int) results.stream().filter(result -> Objects.equals(result.getFinishPosition(), position)).count();
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
        int participants = race.getMaxParticipants() == null ? 12 : race.getMaxParticipants();
        if (participants < 6 || participants > 18) badRequest("Race participants must be between 6 and 18");
        race.setMaxParticipants(participants);
        if (race.getPrizePool() != null && race.getPrizePool().signum() < 0) badRequest("Prize pool cannot be negative");
        LocalDateTime scheduledAt = LocalDateTime.of(race.getRaceDate(), race.getRaceTime());
        if (!scheduledAt.isAfter(LocalDateTime.now())) badRequest("Race date and time must be in the future");
        validateRaceTypeAndDistance(race.getType(), race.getDistanceM());
        if (race.getTournamentId() != null) {
            Tournament tournament = tournamentRepository.findById(race.getTournamentId())
                    .filter(item -> item.getDeletedAt() == null)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Tournament is invalid"));
            if ((tournament.getStartDate() != null && race.getRaceDate().isBefore(tournament.getStartDate()))
                    || (tournament.getEndDate() != null && race.getRaceDate().isAfter(tournament.getEndDate()))) {
                badRequest("Race date must fall within the tournament date range");
            }
        }
        if (race.getRefereeId() != null) {
            userRepository.findById(race.getRefereeId())
                    .filter(user -> user.getDeletedAt() == null && "REFEREE".equals(user.getRole()) && isActive(user))
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assigned referee is invalid"));
            boolean overlap = raceRepository.findByRefereeId(race.getRefereeId()).stream()
                    .filter(other -> currentRaceId == null || !Objects.equals(other.getId(), currentRaceId))
                    .filter(other -> other.getDeletedAt() == null && !"CANCELLED".equals(other.getStatus()))
                    .anyMatch(other -> schedulesOverlap(other, race));
            if (overlap) conflict("Referee already has an overlapping race");
        }
    }

    private void enforceWithdrawalWindow(Race race) {
        LocalDateTime start = LocalDateTime.of(race.getRaceDate(), race.getRaceTime());
        int graceHours = race.getTournamentId() == null ? 120
                : tournamentRepository.findById(race.getTournamentId())
                .map(Tournament::getGracePeriodHours).orElse(120);
        if (!Set.of(72, 120, 168).contains(graceHours)) graceHours = 120;
        LocalDateTime cutoff = start.minusHours(graceHours);
        if (!LocalDateTime.now().isBefore(cutoff)) {
            conflict("The withdrawal cutoff has passed; Admin approval is required");
        }
    }

    private void validateRaceTypeAndDistance(String type, Integer distance) {
        if (distance == null) badRequest("Race distance is required");
        String normalized = normalize(type);
        boolean valid = switch (normalized) {
            case "SPRINT" -> distance >= 1000 && distance <= 1400;
            case "MILE" -> distance >= 1401 && distance <= 1800;
            case "MEDIUM" -> distance >= 1801 && distance <= 2400;
            case "LONG" -> distance >= 2401;
            default -> false;
        };
        if (!valid) badRequest("Race type and distance do not match the v4 distance categories");
    }

    private void ensureParticipantScheduleAvailable(Race target, Long horseId, Long jockeyId) {
        boolean horseOverlap = registrationRepository.findByHorseId(horseId).stream()
                .anyMatch(entry -> activeRegistrationOverlaps(entry, target));
        if (horseOverlap) conflict("Horse is already registered for an overlapping race");
        boolean jockeyOverlap = registrationRepository.findByJockeyId(jockeyId).stream()
                .anyMatch(entry -> activeRegistrationOverlaps(entry, target));
        if (jockeyOverlap) conflict("Jockey is already registered for an overlapping race");
    }

    private boolean activeRegistrationOverlaps(RaceRegistration entry, Race target) {
        if (entry.getDeletedAt() != null
                || Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE").contains(normalize(entry.getStatus()))) {
            return false;
        }
        Race other = raceRepository.findById(entry.getRaceId()).orElse(null);
        return other != null && other.getDeletedAt() == null
                && !Set.of("CANCELLED", "OFFICIAL").contains(normalize(other.getStatus()))
                && schedulesOverlap(other, target);
    }

    private boolean schedulesOverlap(Race first, Race second) {
        if (first.getRaceDate() == null || first.getRaceTime() == null
                || second.getRaceDate() == null || second.getRaceTime() == null) return false;
        LocalDateTime firstStart = LocalDateTime.of(first.getRaceDate(), first.getRaceTime());
        LocalDateTime secondStart = LocalDateTime.of(second.getRaceDate(), second.getRaceTime());
        LocalDateTime firstEnd = firstStart.plusSeconds(maxRaceDuration(first.getType()));
        LocalDateTime secondEnd = secondStart.plusSeconds(maxRaceDuration(second.getType()));
        return firstStart.isBefore(secondEnd) && secondStart.isBefore(firstEnd);
    }

    private int maxRaceDuration(String type) {
        return switch (normalize(type)) {
            case "LONG" -> 198;
            case "MEDIUM" -> 120;
            case "MILE" -> 93;
            default -> 69;
        };
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

    private void releasePairingIfUnused(RaceRegistration registration, Long cancelledRaceId, LocalDateTime now) {
        if (registration.getPairingContractId() == null) return;
        boolean hasAnotherCommitment = registrationRepository.findByPairingContractId(registration.getPairingContractId()).stream()
                .filter(item -> !Objects.equals(item.getRaceId(), cancelledRaceId))
                .filter(item -> item.getDeletedAt() == null)
                .filter(item -> !Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE").contains(normalize(item.getStatus())))
                .map(item -> raceRepository.findById(item.getRaceId()).orElse(null))
                .filter(Objects::nonNull)
                .anyMatch(otherRace -> !Set.of("CANCELLED", "OFFICIAL").contains(normalize(otherRace.getStatus())));
        if (hasAnotherCommitment) return;
        pairingRepository.findById(registration.getPairingContractId()).ifPresent(pairing -> {
            if (!"ACTIVE".equals(normalize(pairing.getStatus()))) return;
            pairing.setStatus("DISSOLVED");
            pairing.setDissolvedAt(now);
            pairingRepository.save(pairing);
            horseRepository.findById(pairing.getHorseId()).ifPresent(horse -> {
                horse.setStatus("AVAILABLE");
                horseRepository.save(horse);
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

    private void notifySpectatorsForRace(Race race, String type, String title, String message) {
        predictionRepository.findByRaceId(race.getId()).stream()
                .map(Prediction::getSpectatorId)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(id -> notificationService.createIfAbsent(id, type, title, message, "/races/" + race.getId()));
    }

    private void distributePrizePool(Race race, List<RaceResult> results) {
        BigDecimal pool = race.getPrizePool() == null ? BigDecimal.ZERO : race.getPrizePool();
        BigDecimal first = pool.multiply(new BigDecimal("0.60")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal second = pool.multiply(new BigDecimal("0.30")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal third = pool.subtract(first).subtract(second);
        Map<Integer, BigDecimal> shares = Map.of(1, first, 2, second, 3, third);
        Map<Integer, List<RaceResult>> eligibleByPosition = results.stream()
                .filter(result -> !Boolean.TRUE.equals(result.getDnf()) && !Boolean.TRUE.equals(result.getDisqualified()))
                .filter(result -> result.getFinishPosition() != null && result.getFinishPosition() <= 3)
                .collect(Collectors.groupingBy(RaceResult::getFinishPosition));
        eligibleByPosition.forEach((position, tiedResults) -> {
            BigDecimal combined = BigDecimal.ZERO;
            for (int occupied = position; occupied < position + tiedResults.size(); occupied++) {
                combined = combined.add(shares.getOrDefault(occupied, BigDecimal.ZERO));
            }
            BigDecimal allocation = tiedResults.isEmpty() ? BigDecimal.ZERO
                    : combined.divide(BigDecimal.valueOf(tiedResults.size()), 0, RoundingMode.HALF_UP);
            tiedResults.forEach(result -> notificationService.createIfAbsent(result.getOwnerId(),
                    "PRIZE_ALLOCATION", "Prize allocation confirmed",
                    "Official " + position + " place allocation"
                            + (tiedResults.size() > 1 ? " (dead heat)" : "") + ": "
                            + allocation.toPlainString() + " points", "/races/" + race.getId()));
        });
    }

    private void settlePredictions(User admin, Race race, List<RaceResult> results) {
        Map<Long, RaceResult> resultsByHorse = results.stream()
                .collect(Collectors.toMap(RaceResult::getHorseId, result -> result));
        for (Prediction prediction : predictionRepository.findByRaceId(race.getId())) {
            RaceResult result = resultsByHorse.get(prediction.getPredictedHorseId());
            boolean eligible = result != null
                    && !Boolean.TRUE.equals(result.getDnf())
                    && !Boolean.TRUE.equals(result.getDisqualified())
                    && result.getFinishPosition() != null
                    && result.getFinishPosition() >= 1
                    && result.getFinishPosition() <= 3;
            int place = result == null || result.getFinishPosition() == null
                    ? Integer.MAX_VALUE : result.getFinishPosition();
            int payout = place == 1 ? value(prediction.getWagerPoints()) * 2 : 0;
            prediction.setStatus("LOCKED"); prediction.setRewardPoints(payout);
            prediction.setSettledAt(LocalDateTime.now()); predictionRepository.save(prediction);
            if (payout > 0) {
                userRepository.findByIdAndDeletedAtIsNull(prediction.getSpectatorId()).ifPresent(spectator -> {
                    spectator.setRewardPoints(value(spectator.getRewardPoints()) + payout);
                    userRepository.save(spectator);
                });
            }
            if (eligible) rewardService.issueOfficialReward(admin, race, prediction, result);
            notificationService.createIfAbsent(prediction.getSpectatorId(), "GUESS_RESULT", "Official guess result",
                    "Your selected pair finished " + (place == Integer.MAX_VALUE ? "outside the official order" : "#" + place)
                            + (payout > 0 ? ". Your point payout is " + payout + "." : ". No point payout was awarded.")
                            + (eligible ? " Your reward is available in Reward Center."
                            : " No reward was issued for this result."),
                    "/races/" + race.getId());
        }
    }

    private void applyStandingPoints(RaceRegistration registration, Integer finishPosition, int points) {
        horseRepository.findById(registration.getHorseId()).ifPresent(horse -> {
            horse.setTotalRaces(value(horse.getTotalRaces()) + 1); horse.setTotalPoints(value(horse.getTotalPoints()) + points);
            if (points > 0 && Objects.equals(finishPosition, 1)) horse.setTotalWins(value(horse.getTotalWins()) + 1);
            if (points > 0 && finishPosition != null && finishPosition <= 3) horse.setTotalTop3(value(horse.getTotalTop3()) + 1);
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
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }

    private String normalizeRaceNoteCategory(String category) {
        String normalized = normalize(category);
        normalized = switch (normalized) {
            case "STUMBLE" -> "INCIDENT";
            case "FALSE_START" -> "START";
            case "INJURY_OBSERVED" -> "INJURY";
            case "OBSERVATION", "GENERAL" -> "OTHER";
            default -> normalized;
        };
        if (!RACE_NOTE_CATEGORIES.contains(normalized)) {
            badRequest("Incident category is invalid");
        }
        return normalized;
    }

    private String normalizeRaceNoteSeverity(String severity) {
        String normalized = normalize(severity);
        normalized = switch (normalized) {
            case "", "MINOR" -> "INFO";
            case "MAJOR" -> "WARNING";
            default -> normalized;
        };
        if (!RACE_NOTE_SEVERITIES.contains(normalized)) {
            badRequest("Race note severity is invalid");
        }
        return normalized;
    }
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

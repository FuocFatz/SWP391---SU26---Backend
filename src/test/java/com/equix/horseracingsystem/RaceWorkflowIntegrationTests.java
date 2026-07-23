package com.equix.horseracingsystem;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import com.equix.horseracingsystem.service.HorseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class RaceWorkflowIntegrationTests {
    @Autowired RaceWorkflowService workflow;
    @Autowired HorseService horseService;
    @Autowired RaceRepository races;
    @Autowired HorseRepository horses;
    @Autowired UserRepository users;
    @Autowired PairingContractRepository pairings;
    @Autowired JockeyInvitationRepository invitations;
    @Autowired RaceRegistrationRepository registrations;
    @Autowired PredictionRepository predictions;
    @Autowired RaceResultRepository results;
    @Autowired RaceNoteRepository notes;
    @Autowired NotificationRepository notifications;
    @Autowired AuditLogRepository audits;
    @Autowired RewardHistoryRepository rewardHistories;
    @Autowired PasswordEncoder passwordEncoder;

    private User owner;
    private User jockey;
    private User spectator;
    private User referee;
    private User admin;
    private Horse horse;
    private Race race;

    @BeforeEach
    void setUp() {
        rewardHistories.deleteAll(); results.deleteAll(); notes.deleteAll(); predictions.deleteAll(); registrations.deleteAll();
        invitations.deleteAll(); pairings.deleteAll(); notifications.deleteAll(); audits.deleteAll();
        races.deleteAll(); horses.deleteAll(); users.deleteAll();

        owner = user("owner-flow@equix.test", "HORSE_OWNER");
        jockey = user("jockey-flow@equix.test", "JOCKEY");
        spectator = user("spectator-flow@equix.test", "SPECTATOR");
        spectator.setRewardPoints(100);
        spectator = users.save(spectator);
        referee = user("referee-flow@equix.test", "REFEREE");
        admin = user("admin-flow@equix.test", "ADMIN");
        horse = horses.save(Horse.builder().horseName("Identity First").ownerId(owner.getId())
                .registrationNumber("TEST-HORSE-1").status("AVAILABLE").build());
        LocalDate date = LocalDate.now().plusDays(14);
        race = races.save(Race.builder().tournamentId(1L).name("Workflow Cup").type("Sprint")
                .distanceM(1200).surface("Turf").raceDate(date).raceTime(LocalTime.NOON)
                .registrationDeadline(LocalDateTime.of(date, LocalTime.NOON).minusWeeks(1))
                .maxParticipants(8).prizePool(BigDecimal.ZERO).refereeId(referee.getId())
                .status("REGISTRATION_OPEN").build());
    }

    @Test
    void newHorseUsesLegacyCompatibleGenderDefault() {
        Horse created = horseService.create(Horse.builder()
                .horseName("Legacy Compatible")
                .ownerId(owner.getId())
                .build());

        assertThat(created.getGender()).isEqualTo("STALLION");
        assertThat(created.getStatus()).isEqualTo("AVAILABLE");
        assertThat(created.getRegistrationNumber()).startsWith("EQX-");
    }

    @Test
    void newHorseNormalizesValidGenderAndRejectsUnsupportedValue() {
        Horse mare = horseService.create(Horse.builder()
                .horseName("Normalized Mare")
                .gender("mare")
                .ownerId(owner.getId())
                .build());

        assertThat(mare.getGender()).isEqualTo("MARE");
        assertThatThrownBy(() -> horseService.create(Horse.builder()
                .horseName("Invalid Gender")
                .gender("COLT")
                .ownerId(owner.getId())
                .build()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("STALLION, MARE, or GELDING");
    }

    @Test
    void pairingMustExistBeforeRegistrationAndClientOwnerIdIsIgnored() {
        RaceRegistrationRequest registrationRequest = new RaceRegistrationRequest();
        registrationRequest.setHorseId(horse.getId());
        registrationRequest.setOwnerId(admin.getId());

        assertThatThrownBy(() -> workflow.registerHorse(owner.getEmail(), race.getId(), registrationRequest))
                .isInstanceOf(ApiException.class).hasMessageContaining("pairing");

        InvitationRequest invitationRequest = new InvitationRequest();
        invitationRequest.setRaceId(race.getId()); invitationRequest.setHorseId(horse.getId());
        invitationRequest.setJockeyId(jockey.getId()); invitationRequest.setOwnerId(admin.getId());
        JockeyInvitation invitation = workflow.inviteJockey(owner.getEmail(), invitationRequest);
        InvitationDecisionRequest decision = new InvitationDecisionRequest(); decision.setStatus("ACCEPTED");
        workflow.respondToInvitation(jockey.getEmail(), invitation.getId(), decision);

        RaceRegistration saved = workflow.registerHorse(owner.getEmail(), race.getId(), registrationRequest);
        assertThat(saved.getOwnerId()).isEqualTo(owner.getId());
        assertThat(saved.getJockeyId()).isEqualTo(jockey.getId());
        assertThat(saved.getPairingContractId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo("PENDING_ADMIN");
    }

    @Test
    void spectatorGuessIsReplacedBeforeStandbyAndLockedAfterward() {
        RaceRegistration registration = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), registration.getId());
        PredictionRequest first = new PredictionRequest(); first.setPredictedHorseId(registration.getHorseId());
        first.setSpectatorId(admin.getId()); first.setWagerPoints(40);
        Prediction created = workflow.createPrediction(spectator.getEmail(), race.getId(), first);
        Prediction replaced = workflow.createPrediction(spectator.getEmail(), race.getId(), first);

        assertThat(replaced.getId()).isEqualTo(created.getId());
        assertThat(replaced.getSpectatorId()).isEqualTo(spectator.getId());
        assertThat(replaced.getWagerPoints()).isEqualTo(40);
        assertThat(users.findById(spectator.getId()).orElseThrow().getRewardPoints()).isEqualTo(60);
        assertThat(replaced.getStatus()).isEqualTo("ACTIVE");
        assertThat(predictions.findByRaceId(race.getId())).hasSize(1);

        race.setStatus("STANDBY"); races.save(race);
        assertThatThrownBy(() -> workflow.createPrediction(spectator.getEmail(), race.getId(), first))
                .isInstanceOf(ApiException.class).hasMessageContaining("locked");
    }

    @Test
    void refereeAcceptsLegacyApprovedRegistration() {
        RaceRegistration registration = pairedRegistration();
        registration.setStatus("APPROVED");
        registrations.save(registration);

        RefereeCheckRequest request = new RefereeCheckRequest();
        request.setApproved(true);
        request.setHealthCheckStatus("FIT");
        request.setNotes("Legacy row checked safely");

        RaceRegistration checked = workflow.refereeCheck(referee.getEmail(), registration.getId(), request);
        assertThat(checked.getStatus()).isEqualTo("CLEARED_TO_RACE");
        assertThat(checked.getRefereeApproved()).isTrue();
        assertThat(audits.findAll()).anyMatch(log -> "APPROVED".equals(log.getBeforeValue())
                && "CLEARED_TO_RACE".equals(log.getAfterValue()));
    }

    @Test
    void adminCanCloseAndReopenRegistrationButCannotSkipTheWorkflow() {
        Race closed = workflow.adminUpdateStatus(admin.getEmail(), race.getId(), "REGISTRATION_CLOSED");
        assertThat(closed.getStatus()).isEqualTo("REGISTRATION_CLOSED");

        Race reopened = workflow.adminUpdateStatus(admin.getEmail(), race.getId(), "REGISTRATION_OPEN");
        assertThat(reopened.getStatus()).isEqualTo("REGISTRATION_OPEN");

        assertThatThrownBy(() -> workflow.adminUpdateStatus(admin.getEmail(), race.getId(), "STANDBY"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("cannot change");
        assertThat(races.findById(race.getId()).orElseThrow().getStatus()).isEqualTo("REGISTRATION_OPEN");
    }

    @Test
    void adminCanDeleteAnEmptyPreStartRace() {
        workflow.deleteRace(admin.getEmail(), race.getId());

        assertThat(races.findById(race.getId()).orElseThrow().getDeletedAt()).isNotNull();
        assertThat(races.findByDeletedAtIsNull()).doesNotContain(race);
        assertThat(audits.findAll()).anyMatch(log -> "DELETE".equals(log.getAction())
                && "RACE".equals(log.getEntityType())
                && race.getId().equals(log.getEntityId()));
    }

    @Test
    void raceWithRelatedActivityMustBeCancelledInsteadOfDeleted() {
        pairedRegistration();

        assertThatThrownBy(() -> workflow.deleteRace(admin.getEmail(), race.getId()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("cancel it instead");
        assertThat(races.findById(race.getId()).orElseThrow().getDeletedAt()).isNull();
    }

    @Test
    void officialResultsRequireRefereeReportAndUseTenSixFourTwoOnePoints() {
        RaceRegistration registration = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), registration.getId());
        RefereeCheckRequest check = new RefereeCheckRequest(); check.setApproved(true);
        workflow.refereeCheck(referee.getEmail(), registration.getId(), check);
        PredictionRequest guess = new PredictionRequest(); guess.setPredictedHorseId(registration.getHorseId());
        workflow.createPrediction(spectator.getEmail(), race.getId(), guess);
        race.setStatus("COMPLETED"); races.save(race);
        RaceResultRequest result = new RaceResultRequest(); result.setRegistrationId(registration.getId());
        result.setFinishPosition(1); result.setFinishTimeSeconds(new BigDecimal("68.12"));
        ConfirmRaceResultsRequest request = new ConfirmRaceResultsRequest(); request.setResults(List.of(result));

        assertThatThrownBy(() -> workflow.confirmResults(admin.getEmail(), race.getId(), request))
                .isInstanceOf(ApiException.class).hasMessageContaining("report");

        RaceReportRequest report = new RaceReportRequest();
        report.setDescription("Race completed cleanly with every incident reviewed.");
        report.setReviewedIncidents(true); report.setSignature("Test Referee");
        workflow.submitRaceReport(referee.getEmail(), race.getId(), report);
        List<RaceResult> official = workflow.confirmResults(admin.getEmail(), race.getId(), request);

        assertThat(official).singleElement().extracting(RaceResult::getPointsAwarded).isEqualTo(10);
        assertThat(races.findById(race.getId()).orElseThrow().getStatus()).isEqualTo("OFFICIAL");
        assertThat(pairings.findAll()).singleElement().extracting(PairingContract::getStatus).isEqualTo("DISSOLVED");
        assertThat(rewardHistories.findAll()).singleElement()
                .satisfies(reward -> {
                    assertThat(reward.getStatus()).isEqualTo(RewardStatus.ISSUED);
                    assertThat(reward.getFinishPosition()).isEqualTo(1);
                    assertThat(reward.getRedemptionCode()).isNull();
                });
    }

    @Test
    void disqualificationRequiresStructuredReasonAndExplicitConfirmation() {
        RaceRegistration registration = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), registration.getId());
        RefereeCheckRequest invalid = new RefereeCheckRequest();
        invalid.setApproved(false); invalid.setDisqualificationReason("Too short");

        assertThatThrownBy(() -> workflow.refereeCheck(referee.getEmail(), registration.getId(), invalid))
                .isInstanceOf(ApiException.class).hasMessageContaining("20 characters");

        RefereeCheckRequest valid = new RefereeCheckRequest();
        valid.setApproved(false);
        valid.setDisqualificationReason("Veterinary inspection found a serious leg injury.");
        valid.setCategory("MEDICAL"); valid.setSeverity("CRITICAL"); valid.setConfirmationText("CONFIRM");
        RaceRegistration rejected = workflow.refereeCheck(referee.getEmail(), registration.getId(), valid);

        assertThat(rejected.getStatus()).isEqualTo("REJECTED_BY_REFEREE");
        assertThat(rejected.getDisqualificationCategory()).isEqualTo("MEDICAL");
        assertThat(rejected.getDisqualifiedBy()).isEqualTo(referee.getId());
        assertThat(rejected.getDisqualifiedAt()).isNotNull();
        assertThat(pairings.findById(rejected.getPairingContractId()).orElseThrow().getStatus()).isEqualTo("DISSOLVED");
    }

    @Test
    void completedRaceCreatesProvisionalResultsAndSupportsSignedReportRevisionLoop() {
        RaceRegistration registration = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), registration.getId());
        RefereeCheckRequest check = new RefereeCheckRequest(); check.setApproved(true);
        workflow.refereeCheck(referee.getEmail(), registration.getId(), check);
        race.setStatus("IN_PROGRESS"); races.save(race);

        workflow.completeRace(referee.getEmail(), race.getId());
        assertThat(results.findByRaceIdOrderByFinishPositionAsc(race.getId()))
                .singleElement().extracting(RaceResult::getOfficial).isEqualTo(false);

        RaceReportRequest report = validReport("Initial signed report covers all recorded race incidents.");
        workflow.submitRaceReport(referee.getEmail(), race.getId(), report);
        AdminReportRevisionRequest revision = new AdminReportRevisionRequest();
        revision.setReason("Clarify the incident timing and action taken in the report.");
        assertThat(workflow.requestReportRevision(admin.getEmail(), race.getId(), revision).getStatus())
                .isEqualTo("REVISION_REQUIRED");

        workflow.submitRaceReport(referee.getEmail(), race.getId(),
                validReport("Revised signed report clarifies incident timing and action taken."));
        assertThat(notes.findByRaceIdOrderByCreatedAtAsc(race.getId()).stream()
                .filter(note -> "RACE_REPORT".equals(note.getNoteCategory())).map(RaceNote::getRevisionNumber))
                .containsExactly(1, 2);
        assertThat(races.findById(race.getId()).orElseThrow().getStatus()).isEqualTo("REPORT_READY");
    }

    @Test
    void raceIncidentAndReportValuesAreNormalizedForSqlServerV4Constraints() {
        race.setStatus("COMPLETED");
        races.save(race);

        RaceIncidentNoteRequest incident = new RaceIncidentNoteRequest();
        incident.setCategory("OBSERVATION");
        incident.setSeverity("MINOR");
        incident.setDescription("Track condition changed near the final corner.");
        RaceNote savedIncident = workflow.addRaceIncident(referee.getEmail(), race.getId(), incident);

        RaceReportRequest report = validReport("Signed report includes the track condition incident and final review.");
        report.setSeverity("MAJOR");
        RaceNote savedReport = workflow.submitRaceReport(referee.getEmail(), race.getId(), report);

        assertThat(savedIncident.getNoteCategory()).isEqualTo("OTHER");
        assertThat(savedIncident.getSeverity()).isEqualTo("INFO");
        assertThat(savedReport.getNoteCategory()).isEqualTo("RACE_REPORT");
        assertThat(savedReport.getSeverity()).isEqualTo("WARNING");
    }

    @Test
    void registrationDeadlineAutoClosesAndFlagsRaceBelowMinimum() {
        race.setRegistrationDeadline(LocalDateTime.now().minusMinutes(1));
        races.save(race);

        assertThat(workflow.closeExpiredRegistrations()).isEqualTo(1);
        Race closed = races.findById(race.getId()).orElseThrow();
        assertThat(closed.getStatus()).isEqualTo("REGISTRATION_CLOSED");
        assertThat(closed.getAdminReviewRequired()).isTrue();
        assertThat(closed.getReviewReason()).contains("minimum is 6");
    }

    @Test
    void adminCanBulkApprovePendingPairRegistrations() {
        RaceRegistration registration = pairedRegistration();

        assertThat(workflow.approveRegistrations(admin.getEmail(), List.of(registration.getId())))
                .singleElement().extracting(RaceRegistration::getStatus).isEqualTo("READY_FOR_CHECK");
    }

    @Test
    void pendingEntryCannotBeGuessedAndSimulationRequiresAssignedReferee() {
        RaceRegistration registration = pairedRegistration();
        PredictionRequest guess = new PredictionRequest(); guess.setPredictedHorseId(registration.getHorseId());
        assertThatThrownBy(() -> workflow.createPrediction(spectator.getEmail(), race.getId(), guess))
                .isInstanceOf(ApiException.class).hasMessageContaining("Admin-approved");

        race.setStatus("IN_PROGRESS"); races.save(race);
        assertThatThrownBy(() -> workflow.simulateRaceForReferee(spectator.getEmail(), race.getId(), 67))
                .isInstanceOf(ApiException.class).hasMessageContaining("Role");
    }

    @Test
    void refereeDnfStopsTrackingAndCreatesProvisionalDnfResult() {
        RaceRegistration registration = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), registration.getId());
        RefereeCheckRequest check = new RefereeCheckRequest(); check.setApproved(true);
        workflow.refereeCheck(referee.getEmail(), registration.getId(), check);
        race.setStatus("IN_PROGRESS"); races.save(race);

        DnfRequest dnf = new DnfRequest(); dnf.setReason("Horse stumbled and could not safely continue.");
        workflow.markDnf(referee.getEmail(), registration.getId(), dnf);
        workflow.completeRace(referee.getEmail(), race.getId());

        RaceRegistration stopped = registrations.findById(registration.getId()).orElseThrow();
        assertThat(stopped.getStatus()).isEqualTo("DNF");
        assertThat(horses.findById(horse.getId()).orElseThrow().getStatus()).isEqualTo("UNAVAILABLE");
        assertThat(results.findByRaceIdOrderByFinishPositionAsc(race.getId())).singleElement().satisfies(result -> {
            assertThat(result.getDnf()).isTrue();
            assertThat(result.getFinishPosition()).isNull();
            assertThat(result.getOfficial()).isFalse();
        });
    }

    @Test
    void deadHeatAllowsSharedPositionAndAwardsFullLeaderboardPoints() {
        RaceRegistration first = pairedRegistration();
        workflow.approveRegistration(admin.getEmail(), first.getId());
        RefereeCheckRequest fit = new RefereeCheckRequest(); fit.setApproved(true);
        workflow.refereeCheck(referee.getEmail(), first.getId(), fit);

        User ownerTwo = user("owner-two@equix.test", "HORSE_OWNER");
        User jockeyTwo = user("jockey-two@equix.test", "JOCKEY");
        Horse horseTwo = horses.save(Horse.builder().horseName("Photo Finish")
                .registrationNumber("TEST-HORSE-2").ownerId(ownerTwo.getId()).status("PAIRED").build());
        pairings.save(PairingContract.builder().horseId(horseTwo.getId()).ownerId(ownerTwo.getId())
                .jockeyId(jockeyTwo.getId()).status("ACTIVE").build());
        RaceRegistrationRequest secondRequest = new RaceRegistrationRequest(); secondRequest.setHorseId(horseTwo.getId());
        RaceRegistration second = workflow.registerHorse(ownerTwo.getEmail(), race.getId(), secondRequest);
        workflow.approveRegistration(admin.getEmail(), second.getId());
        workflow.refereeCheck(referee.getEmail(), second.getId(), fit);

        race.setStatus("COMPLETED"); races.save(race);
        workflow.submitRaceReport(referee.getEmail(), race.getId(), validReport("Signed photo-finish report confirms an official dead heat."));
        RaceResultRequest firstResult = new RaceResultRequest(); firstResult.setRegistrationId(first.getId());
        firstResult.setFinishPosition(1); firstResult.setFinishTimeSeconds(new BigDecimal("68.12"));
        RaceResultRequest secondResult = new RaceResultRequest(); secondResult.setRegistrationId(second.getId());
        secondResult.setFinishPosition(1); secondResult.setFinishTimeSeconds(new BigDecimal("68.12"));
        ConfirmRaceResultsRequest confirmation = new ConfirmRaceResultsRequest();
        confirmation.setResults(List.of(firstResult, secondResult));

        assertThat(workflow.confirmResults(admin.getEmail(), race.getId(), confirmation))
                .hasSize(2).allSatisfy(result -> {
                    assertThat(result.getFinishPosition()).isEqualTo(1);
                    assertThat(result.getPointsAwarded()).isEqualTo(10);
                });
    }

    private RaceRegistration pairedRegistration() {
        PairingContract pairing = pairings.save(PairingContract.builder().horseId(horse.getId())
                .ownerId(owner.getId()).jockeyId(jockey.getId()).status("ACTIVE").build());
        horse.setStatus("PAIRED"); horses.save(horse);
        RaceRegistrationRequest request = new RaceRegistrationRequest(); request.setHorseId(horse.getId());
        RaceRegistration registration = workflow.registerHorse(owner.getEmail(), race.getId(), request);
        assertThat(registration.getPairingContractId()).isEqualTo(pairing.getId());
        return registration;
    }

    private RaceReportRequest validReport(String description) {
        RaceReportRequest report = new RaceReportRequest();
        report.setDescription(description); report.setSeverity("INFO");
        report.setActionTaken("All required checks completed");
        report.setReviewedIncidents(true); report.setSignature("Test Referee");
        return report;
    }

    private User user(String email, String role) {
        return users.save(User.builder().username(email.substring(0, email.indexOf('@'))).fullName(role)
                .email(email).password(passwordEncoder.encode("Password123")).role(role)
                .status("VERIFIED").rewardPoints(0).build());
    }
}

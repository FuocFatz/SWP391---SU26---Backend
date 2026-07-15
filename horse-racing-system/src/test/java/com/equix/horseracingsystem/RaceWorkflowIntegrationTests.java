package com.equix.horseracingsystem;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.RaceWorkflowService;
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
        results.deleteAll(); notes.deleteAll(); predictions.deleteAll(); registrations.deleteAll();
        invitations.deleteAll(); pairings.deleteAll(); notifications.deleteAll(); audits.deleteAll();
        races.deleteAll(); horses.deleteAll(); users.deleteAll();

        owner = user("owner-flow@equix.test", "HORSE_OWNER");
        jockey = user("jockey-flow@equix.test", "JOCKEY");
        spectator = user("spectator-flow@equix.test", "SPECTATOR");
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
        PredictionRequest first = new PredictionRequest(); first.setPredictedHorseId(registration.getHorseId());
        first.setSpectatorId(admin.getId()); first.setWagerPoints(999);
        Prediction created = workflow.createPrediction(spectator.getEmail(), race.getId(), first);
        Prediction replaced = workflow.createPrediction(spectator.getEmail(), race.getId(), first);

        assertThat(replaced.getId()).isEqualTo(created.getId());
        assertThat(replaced.getSpectatorId()).isEqualTo(spectator.getId());
        assertThat(replaced.getWagerPoints()).isZero();
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
    void officialResultsRequireRefereeReportAndUseTenSixFourTwoOnePoints() {
        RaceRegistration registration = pairedRegistration();
        race.setStatus("COMPLETED"); races.save(race);
        RaceResultRequest result = new RaceResultRequest(); result.setRegistrationId(registration.getId());
        result.setFinishPosition(1); result.setFinishTimeSeconds(new BigDecimal("68.12"));
        ConfirmRaceResultsRequest request = new ConfirmRaceResultsRequest(); request.setResults(List.of(result));

        assertThatThrownBy(() -> workflow.confirmResults(admin.getEmail(), race.getId(), request))
                .isInstanceOf(ApiException.class).hasMessageContaining("report");

        RaceReportRequest report = new RaceReportRequest(); report.setDescription("Clean race");
        workflow.submitRaceReport(referee.getEmail(), race.getId(), report);
        List<RaceResult> official = workflow.confirmResults(admin.getEmail(), race.getId(), request);

        assertThat(official).singleElement().extracting(RaceResult::getPointsAwarded).isEqualTo(10);
        assertThat(races.findById(race.getId()).orElseThrow().getStatus()).isEqualTo("OFFICIAL");
        assertThat(pairings.findAll()).singleElement().extracting(PairingContract::getStatus).isEqualTo("DISSOLVED");
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

    private User user(String email, String role) {
        return users.save(User.builder().username(email.substring(0, email.indexOf('@'))).fullName(role)
                .email(email).password(passwordEncoder.encode("Password123")).role(role)
                .status("VERIFIED").rewardPoints(0).build());
    }
}

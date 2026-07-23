package com.equix.horseracingsystem;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.controller.TournamentController;
import com.equix.horseracingsystem.dto.CancelRaceRequest;
import com.equix.horseracingsystem.dto.RescheduleRaceRequest;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.PairingContract;
import com.equix.horseracingsystem.entity.Prediction;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.RaceRegistration;
import com.equix.horseracingsystem.entity.RaceResult;
import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.JockeyInvitationRepository;
import com.equix.horseracingsystem.repository.NotificationRepository;
import com.equix.horseracingsystem.repository.PairingContractRepository;
import com.equix.horseracingsystem.repository.PredictionRepository;
import com.equix.horseracingsystem.repository.RaceNoteRepository;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.RaceResultRepository;
import com.equix.horseracingsystem.repository.RewardHistoryRepository;
import com.equix.horseracingsystem.repository.TournamentRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.AdminAnalyticsService;
import com.equix.horseracingsystem.service.RaceWorkflowService;
import com.equix.horseracingsystem.service.TournamentStandingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class BusinessExpansionIntegrationTests {

    @Autowired RaceWorkflowService workflow;
    @Autowired TournamentStandingService standings;
    @Autowired TournamentController tournamentController;
    @Autowired AdminAnalyticsService analytics;
    @Autowired UserRepository users;
    @Autowired HorseRepository horses;
    @Autowired TournamentRepository tournaments;
    @Autowired RaceRepository races;
    @Autowired RaceRegistrationRepository registrations;
    @Autowired PairingContractRepository pairings;
    @Autowired PredictionRepository predictions;
    @Autowired RaceResultRepository results;
    @Autowired JockeyInvitationRepository invitations;
    @Autowired RaceNoteRepository notes;
    @Autowired RewardHistoryRepository rewards;
    @Autowired NotificationRepository notifications;
    @Autowired AuditLogRepository audits;
    @Autowired PasswordEncoder passwordEncoder;

    private User admin;
    private User owner;
    private User jockey;
    private User spectator;
    private User referee;
    private Tournament tournament;
    private Horse horse;
    private Race race;

    @BeforeEach
    void setUp() {
        rewards.deleteAll();
        results.deleteAll();
        notes.deleteAll();
        predictions.deleteAll();
        registrations.deleteAll();
        invitations.deleteAll();
        pairings.deleteAll();
        notifications.deleteAll();
        audits.deleteAll();
        races.deleteAll();
        tournaments.deleteAll();
        horses.deleteAll();
        users.deleteAll();

        admin = user("expansion-admin@equix.test", "ADMIN");
        owner = user("expansion-owner@equix.test", "HORSE_OWNER");
        jockey = user("expansion-jockey@equix.test", "JOCKEY");
        spectator = user("expansion-spectator@equix.test", "SPECTATOR");
        referee = user("expansion-referee@equix.test", "REFEREE");
        tournament = tournaments.save(Tournament.builder().name("Expansion Championship")
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusMonths(2)).status("OPEN").build());
        horse = horses.save(Horse.builder().horseName("Realtime Star").ownerId(owner.getId())
                .registrationNumber("EXP-HORSE-1").status("PAIRED").build());
        race = races.save(Race.builder().tournamentId(tournament.getId()).name("Expansion Cup").type("Sprint")
                .distanceM(1200).surface("Turf").raceDate(LocalDate.now().plusDays(21)).raceTime(LocalTime.NOON)
                .registrationDeadline(LocalDateTime.now().plusDays(14)).maxParticipants(8)
                .prizePool(new BigDecimal("10000")).refereeId(referee.getId()).status("REGISTRATION_OPEN").build());
    }

    @Test
    void cancellingRaceVoidsEntriesGuessesAndReleasesUnusedPairing() {
        PairingContract pairing = pairings.save(PairingContract.builder().horseId(horse.getId())
                .ownerId(owner.getId()).jockeyId(jockey.getId()).status("ACTIVE").build());
        RaceRegistration registration = registrations.save(RaceRegistration.builder().raceId(race.getId())
                .horseId(horse.getId()).ownerId(owner.getId()).jockeyId(jockey.getId())
                .pairingContractId(pairing.getId()).status("APPROVED").build());
        Prediction prediction = predictions.save(Prediction.builder().raceId(race.getId())
                .spectatorId(spectator.getId()).predictedHorseId(horse.getId()).status("ACTIVE").build());
        CancelRaceRequest request = new CancelRaceRequest();
        request.setReason("Severe weather warning");

        Race cancelled = workflow.cancelRace(admin.getEmail(), race.getId(), request);

        assertThat(cancelled.getStatus()).isEqualTo("CANCELLED");
        assertThat(cancelled.getCancellationReason()).isEqualTo("Severe weather warning");
        assertThat(registrations.findById(registration.getId()).orElseThrow().getStatus()).isEqualTo("CANCELLED");
        assertThat(predictions.findById(prediction.getId()).orElseThrow().getStatus()).isEqualTo("VOIDED");
        assertThat(pairings.findById(pairing.getId()).orElseThrow().getStatus()).isEqualTo("DISSOLVED");
        assertThat(horses.findById(horse.getId()).orElseThrow().getStatus()).isEqualTo("AVAILABLE");
        assertThat(notifications.findByUserIdOrderByCreatedAtDesc(spectator.getId()))
                .anyMatch(notification -> "RACE_CANCELLED".equals(notification.getType()));
    }

    @Test
    void adminCanRescheduleFutureRaceAndCancelledRaceReopensSafely() {
        CancelRaceRequest cancel = new CancelRaceRequest();
        cancel.setReason("Track maintenance");
        workflow.cancelRace(admin.getEmail(), race.getId(), cancel);

        LocalDateTime newSchedule = LocalDateTime.now().plusDays(30).withHour(15).withMinute(30).withSecond(0).withNano(0);
        RescheduleRaceRequest request = new RescheduleRaceRequest();
        request.setScheduledAt(newSchedule);
        request.setReason("Track maintenance completed");

        Race rescheduled = workflow.rescheduleRace(admin.getEmail(), race.getId(), request);

        assertThat(rescheduled.getRaceDate()).isEqualTo(newSchedule.toLocalDate());
        assertThat(rescheduled.getRaceTime()).isEqualTo(newSchedule.toLocalTime());
        assertThat(rescheduled.getStatus()).isEqualTo("REGISTRATION_OPEN");
        assertThat(rescheduled.getRescheduleReason()).isEqualTo("Track maintenance completed");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void tournamentDeleteIsSoftAndBlockedAfterRegistrationOpens() {
        assertThatThrownBy(() -> tournamentController.delete(tournament.getId()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Draft or Cancelled");

        Tournament unused = tournaments.save(Tournament.builder().name("Unused Tournament")
                .startDate(LocalDate.now().plusMonths(3)).endDate(LocalDate.now().plusMonths(4))
                .status("OPEN").build());
        tournamentController.delete(unused.getId());

        assertThat(tournaments.findById(unused.getId()).orElseThrow().getDeletedAt()).isNotNull();
        assertThat(tournaments.findByIdAndDeletedAtIsNull(unused.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanCloseAndReopenTournamentWithValidatedStatuses() {
        Tournament payload = Tournament.builder()
                .name(tournament.getName())
                .description(tournament.getDescription())
                .location(tournament.getLocation())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .gracePeriodHours(120)
                .status("closed")
                .build();

        assertThat(tournamentController.update(tournament.getId(), payload).getStatus()).isEqualTo("CLOSED");
        payload.setStatus("OPEN");
        assertThat(tournamentController.update(tournament.getId(), payload).getStatus()).isEqualTo("OPEN");

        payload.setStatus("UNKNOWN");
        assertThatThrownBy(() -> tournamentController.update(tournament.getId(), payload))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Tournament status");
    }

    @Test
    void tournamentStandingUsesOfficialPointsAndPrizeTieBreakData() {
        race.setStatus("OFFICIAL");
        races.save(race);
        results.save(RaceResult.builder().raceId(race.getId()).horseId(horse.getId()).ownerId(owner.getId())
                .jockeyId(jockey.getId()).finishPosition(1).pointsAwarded(10).official(true).build());

        Map<String, Object> leader = standings.standings(tournament.getId()).get(0);

        assertThat(leader.get("rank")).isEqualTo(1);
        assertThat(leader.get("horseName")).isEqualTo("Realtime Star");
        assertThat(leader.get("totalPoints")).isEqualTo(10);
        assertThat(leader.get("prizeMoney")).isEqualTo(new BigDecimal("6000"));
    }

    @Test
    void analyticsUsesLiveRepositoriesAndRejectsNonAdminUsers() {
        Map<String, Object> overview = analytics.overview(admin.getEmail());
        @SuppressWarnings("unchecked") Map<String, Object> totals = (Map<String, Object>) overview.get("totals");

        assertThat(totals.get("users")).isEqualTo(5);
        assertThat(totals.get("races")).isEqualTo(1);
        assertThat(overview.get("usersByRole")).isInstanceOf(Map.class);
        assertThatThrownBy(() -> analytics.overview(owner.getEmail()))
                .isInstanceOf(ApiException.class).hasMessageContaining("Admin");
    }

    private User user(String email, String role) {
        return users.save(User.builder().username(email.substring(0, email.indexOf('@'))).fullName(role)
                .email(email).password(passwordEncoder.encode("Password123")).role(role)
                .status("VERIFIED").rewardPoints(0).build());
    }
}

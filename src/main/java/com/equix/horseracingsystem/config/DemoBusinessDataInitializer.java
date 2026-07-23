package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.entity.*;
import com.equix.horseracingsystem.repository.*;
import com.equix.horseracingsystem.service.NotificationService;
import com.equix.horseracingsystem.service.RewardService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Component
@Order(200)
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoBusinessDataInitializer implements CommandLineRunner {
    private static final String OPEN_RACE = "EquiX Demo Open";
    private static final String CHECK_RACE = "EquiX Demo Referee Check";
    private static final String GOODS_RACE = "EquiX Demo Official Classic";
    private static final String VOUCHER_RACE = "EquiX Demo Official Voucher";

    private final UserRepository users;
    private final HorseRepository horses;
    private final TournamentRepository tournaments;
    private final RaceRepository races;
    private final PairingContractRepository pairings;
    private final JockeyInvitationRepository invitations;
    private final RaceRegistrationRepository registrations;
    private final RaceResultRepository results;
    private final PredictionRepository predictions;
    private final RewardService rewards;
    private final NotificationService notifications;
    private final PasswordEncoder passwordEncoder;

    public DemoBusinessDataInitializer(UserRepository users,
                                       HorseRepository horses,
                                       TournamentRepository tournaments,
                                       RaceRepository races,
                                       PairingContractRepository pairings,
                                       JockeyInvitationRepository invitations,
                                       RaceRegistrationRepository registrations,
                                       RaceResultRepository results,
                                       PredictionRepository predictions,
                                       RewardService rewards,
                                       NotificationService notifications,
                                       PasswordEncoder passwordEncoder) {
        this.users = users;
        this.horses = horses;
        this.tournaments = tournaments;
        this.races = races;
        this.pairings = pairings;
        this.invitations = invitations;
        this.registrations = registrations;
        this.results = results;
        this.predictions = predictions;
        this.rewards = rewards;
        this.notifications = notifications;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User admin = demoUser("ADMIN");
        User owner = demoUser("HORSE_OWNER");
        User jockey = demoUser("JOCKEY");
        List<User> supportJockeys = supportJockeys();
        User supportJockey = supportJockeys.get(0);
        User referee = demoUser("REFEREE");
        User spectator = demoUser("SPECTATOR");
        Tournament tournament = demoTournament();
        List<Horse> demoHorses = ensureHorses(owner);
        releaseDemoJockeyPairings(jockey, demoHorses);
        PairingContract activePairing = activePairing(demoHorses.get(0), owner, supportJockey);

        Race openRace = race(tournament, referee, OPEN_RACE, LocalDate.now().plusDays(21), "REGISTRATION_OPEN");
        registration(openRace, demoHorses.get(0), owner, supportJockey, activePairing, 1, "PENDING_ADMIN");
        pendingInvitation(openRace, demoHorses.get(2), owner, jockey);

        Race checkRace = race(tournament, referee, CHECK_RACE, LocalDate.now().plusDays(10), "REGISTRATION_CLOSED");
        for (int index = 0; index < 6; index++) {
            Horse horse = demoHorses.get(index);
            User assignedJockey = supportJockeys.get(index);
            PairingContract pairing = index == 0
                    ? activePairing
                    : activePairing(horse, owner, assignedJockey);
            registration(checkRace, horse, owner, assignedJockey, pairing,
                    index + 1, "READY_FOR_CHECK");
        }

        Race goodsRace = race(tournament, referee, GOODS_RACE, LocalDate.now().minusDays(7), "OFFICIAL");
        seedOfficialReward(admin, spectator, goodsRace, demoHorses.get(1), owner, supportJockey,
                historicalPairing(demoHorses.get(1), owner, supportJockey), 1);

        Race voucherRace = race(tournament, referee, VOUCHER_RACE, LocalDate.now().minusDays(3), "OFFICIAL");
        seedOfficialReward(admin, spectator, voucherRace, demoHorses.get(2), owner, supportJockey,
                historicalPairing(demoHorses.get(2), owner, supportJockey), 2);

        notifications.createIfAbsent(spectator.getId(), "DEMO_READY", "Demo workflow ready",
                "Open EquiX Demo Open to place or update a guess, then review issued rewards.", "/dashboard/rewards");
    }

    private User demoUser(String role) {
        return users.findByRoleAndDeletedAtIsNull(role).stream()
                .filter(user -> "VERIFIED".equals(user.getStatus()) || "ACTIVE".equals(user.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing active demo account for role " + role));
    }

    private List<User> supportJockeys() {
        List<User> supportJockeys = new ArrayList<>();
        for (int lane = 1; lane <= 6; lane++) {
            String suffix = lane == 1 ? "" : "-" + lane;
            String email = "demo-support-jockey" + suffix + "@equix.invalid";
            int laneNumber = lane;
            supportJockeys.add(users.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                    .orElseGet(() -> users.save(User.builder()
                            .username("demo_support_jockey" + (laneNumber == 1 ? "" : "_" + laneNumber))
                            .fullName("EquiX Support Jockey " + laneNumber)
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role("JOCKEY").status("VERIFIED").rewardPoints(User.INITIAL_REWARD_POINTS).build())));
        }
        return supportJockeys;
    }

    private Tournament demoTournament() {
        return tournaments.findAll().stream()
                .filter(item -> "EquiX Final Demo Tournament".equals(item.getName()))
                .findFirst()
                .orElseGet(() -> tournaments.save(Tournament.builder()
                        .name("EquiX Final Demo Tournament")
                        .description("Idempotent local dataset for the SWP391 final demonstration.")
                        .location("EquiX Demo Track")
                        .startDate(LocalDate.now().minusDays(14))
                        .endDate(LocalDate.now().plusDays(45))
                        .status("OPEN")
                        .build()));
    }

    private List<Horse> ensureHorses(User owner) {
        List<Horse> current = new ArrayList<>(horses.findByOwnerIdAndDeletedAtIsNull(owner.getId()));
        List<Horse> demoHorses = new ArrayList<>();
        String[] names = {"Thunder Bolt", "Silver Moon", "Golden Step", "Crimson Comet", "Midnight Echo", "Royal Tempest"};
        for (int index = 0; index < names.length; index++) {
            String registrationNumber = "EQUIX-DEMO-" + (index + 1);
            Horse existing = current.stream()
                    .filter(item -> registrationNumber.equals(item.getRegistrationNumber()))
                    .findFirst()
                    .orElse(null);
            if (existing == null) {
                existing = horses.save(Horse.builder()
                        .horseName(names[index])
                        .registrationNumber(registrationNumber)
                        .breed("Thoroughbred")
                        .age(4 + index)
                        .speed(82 - index)
                        .stamina(78 + index)
                        .healthStatus("HEALTHY")
                        .status("AVAILABLE")
                        .ownerId(owner.getId())
                        .build());
            }
            demoHorses.add(existing);
        }
        return demoHorses;
    }

    private PairingContract activePairing(Horse horse, User owner, User jockey) {
        return pairings.findByHorseIdAndOwnerIdAndStatus(horse.getId(), owner.getId(), "ACTIVE")
                .orElseGet(() -> {
                    horse.setStatus("PAIRED");
                    horses.save(horse);
                    return pairings.save(PairingContract.builder()
                            .horseId(horse.getId()).ownerId(owner.getId()).jockeyId(jockey.getId())
                            .status("ACTIVE").build());
                });
    }

    private void releaseDemoJockeyPairings(User demoJockey, List<Horse> demoHorses) {
        List<Long> horseIds = demoHorses.stream().map(Horse::getId).toList();
        pairings.findAll().stream()
                .filter(item -> item.getJockeyId().equals(demoJockey.getId()))
                .filter(item -> horseIds.contains(item.getHorseId()))
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .forEach(item -> {
                    item.setStatus("DISSOLVED");
                    item.setDissolvedAt(LocalDateTime.now());
                    pairings.save(item);
                });
    }

    private PairingContract historicalPairing(Horse horse, User owner, User jockey) {
        return pairings.findAll().stream()
                .filter(item -> item.getHorseId().equals(horse.getId())
                        && item.getOwnerId().equals(owner.getId())
                        && item.getJockeyId().equals(jockey.getId())
                        && "DISSOLVED".equals(item.getStatus()))
                .findFirst()
                .orElseGet(() -> pairings.save(PairingContract.builder()
                        .horseId(horse.getId()).ownerId(owner.getId()).jockeyId(jockey.getId())
                        .status("DISSOLVED").dissolvedAt(LocalDateTime.now()).build()));
    }

    private Race race(Tournament tournament, User referee, String name, LocalDate date, String status) {
        return races.findAll().stream().filter(item -> name.equals(item.getName())).findFirst()
                .orElseGet(() -> races.save(Race.builder()
                        .tournamentId(tournament.getId()).name(name).type("SPRINT")
                        .distanceM(1200).surface("TURF").weather("CLEAR")
                        .location("EquiX Demo Track").raceDate(date).raceTime(LocalTime.of(14, 0))
                        .registrationDeadline(LocalDateTime.of(date, LocalTime.of(14, 0)).minusWeeks(1))
                        .maxParticipants(8).prizePool(BigDecimal.valueOf(10_000))
                        .refereeId(referee.getId()).status(status).build()));
    }

    private RaceRegistration registration(Race race, Horse horse, User owner, User jockey,
                                          PairingContract pairing, int lane, String status) {
        return registrations.findByRaceIdAndHorseId(race.getId(), horse.getId())
                .map(existing -> {
                    existing.setJockeyId(jockey.getId());
                    existing.setPairingContractId(pairing.getId());
                    return registrations.save(existing);
                })
                .orElseGet(() -> registrations.save(RaceRegistration.builder()
                        .raceId(race.getId()).horseId(horse.getId()).ownerId(owner.getId())
                        .jockeyId(jockey.getId()).pairingContractId(pairing.getId()).laneNumber(lane)
                        .status(status).ownerConfirmed(true).jockeyConfirmed(true)
                        .refereeApproved("CLEARED_TO_RACE".equals(status))
                        .healthCheckStatus("CLEARED_TO_RACE".equals(status) ? "FIT" : "PENDING")
                        .build()));
    }

    private void pendingInvitation(Race race, Horse horse, User owner, User jockey) {
        if (invitations.findByRaceId(race.getId()).stream()
                .anyMatch(item -> item.getHorseId().equals(horse.getId()))) return;
        invitations.save(JockeyInvitation.builder()
                .raceId(race.getId()).horseId(horse.getId()).ownerId(owner.getId())
                .jockeyId(jockey.getId()).status("PENDING")
                .message("Final demo invitation: review this horse-race assignment.").build());
    }

    private void seedOfficialReward(User admin, User spectator, Race race, Horse horse,
                                    User owner, User jockey, PairingContract pairing, int finishPosition) {
        RaceRegistration registration = registration(race, horse, owner, jockey, pairing,
                finishPosition, "CLEARED_TO_RACE");
        RaceResult result = results.findByRaceIdOrderByFinishPositionAsc(race.getId()).stream()
                .filter(item -> item.getHorseId().equals(horse.getId())).findFirst()
                .orElseGet(() -> results.save(RaceResult.builder()
                        .raceId(race.getId()).registrationId(registration.getId()).horseId(horse.getId())
                        .jockeyId(jockey.getId()).ownerId(owner.getId()).finishPosition(finishPosition)
                        .finishTimeSeconds(BigDecimal.valueOf(68 + finishPosition))
                        .pointsAwarded(finishPosition == 1 ? 10 : 6)
                        .dnf(false).disqualified(false).official(true).build()));
        if (!Objects.equals(result.getJockeyId(), jockey.getId())) {
            result.setJockeyId(jockey.getId());
            result = results.save(result);
        }
        Prediction prediction = predictions.findFirstBySpectatorIdAndRaceId(spectator.getId(), race.getId())
                .orElseGet(() -> predictions.save(Prediction.builder()
                        .raceId(race.getId()).spectatorId(spectator.getId()).predictedHorseId(horse.getId())
                        .wagerPoints(0).rewardPoints(0).status("LOCKED").settledAt(LocalDateTime.now()).build()));
        rewards.issueOfficialReward(admin, race, prediction, result);
    }
}

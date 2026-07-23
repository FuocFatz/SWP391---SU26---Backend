package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.RewardHistory;
import com.equix.horseracingsystem.entity.RewardStatus;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.PredictionRepository;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.RewardHistoryRepository;
import com.equix.horseracingsystem.repository.TournamentRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    private static final Set<String> ACTIVE_RACE_STATUSES = Set.of(
            "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "STANDBY", "IN_PROGRESS");
    private static final Set<RewardStatus> OPEN_REWARD_STATUSES = Set.of(
            RewardStatus.ISSUED, RewardStatus.CLAIMED, RewardStatus.PROCESSING, RewardStatus.SHIPPED);

    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final PredictionRepository predictionRepository;
    private final RewardHistoryRepository rewardRepository;

    public AdminAnalyticsService(UserRepository userRepository,
                                 HorseRepository horseRepository,
                                 TournamentRepository tournamentRepository,
                                 RaceRepository raceRepository,
                                 RaceRegistrationRepository registrationRepository,
                                 PredictionRepository predictionRepository,
                                 RewardHistoryRepository rewardRepository) {
        this.userRepository = userRepository;
        this.horseRepository = horseRepository;
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.predictionRepository = predictionRepository;
        this.rewardRepository = rewardRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> overview(String email) {
        requireAdmin(email);
        List<User> users = userRepository.findAllByDeletedAtIsNull();
        List<Horse> horses = horseRepository.findByDeletedAtIsNull();
        List<Race> races = raceRepository.findAll().stream().filter(race -> race.getDeletedAt() == null).toList();
        List<RewardHistory> rewards = rewardRepository.findAll();
        long predictionCount = predictionRepository.count();
        long successfulPredictions = rewards.stream().filter(reward -> reward.getPredictionId() != null).count();

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("users", users.size());
        totals.put("activeUsers", users.stream().filter(this::isActive).count());
        totals.put("horses", horses.size());
        totals.put("tournaments", tournamentRepository.count());
        totals.put("races", races.size());
        totals.put("activeRaces", races.stream().filter(race -> ACTIVE_RACE_STATUSES.contains(normalize(race.getStatus()))).count());
        totals.put("registrations", registrationRepository.findAll().stream().filter(item -> item.getDeletedAt() == null).count());
        totals.put("predictions", predictionCount);
        totals.put("successfulPredictions", successfulPredictions);
        totals.put("predictionSuccessRate", predictionCount == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(successfulPredictions * 100.0 / predictionCount).setScale(1, RoundingMode.HALF_UP));
        totals.put("rewards", rewards.size());
        totals.put("openRewards", rewards.stream().filter(reward -> OPEN_REWARD_STATUSES.contains(reward.getStatus())).count());

        Map<String, Long> usersByRole = users.stream().collect(Collectors.groupingBy(
                user -> normalize(user.getRole()), LinkedHashMap::new, Collectors.counting()));
        Map<String, Long> racesByStatus = races.stream().collect(Collectors.groupingBy(
                race -> normalize(race.getStatus()), LinkedHashMap::new, Collectors.counting()));
        Map<String, Long> rewardsByStatus = rewards.stream().collect(Collectors.groupingBy(
                reward -> reward.getStatus() == null ? "UNKNOWN" : reward.getStatus().name(),
                LinkedHashMap::new, Collectors.counting()));

        List<Map<String, Object>> topHorses = horses.stream()
                .sorted(Comparator.comparing(Horse::getTotalPoints, Comparator.nullsFirst(Integer::compareTo)).reversed())
                .limit(5)
                .map(horse -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("horseId", horse.getId());
                    row.put("horseName", horse.getHorseName());
                    row.put("points", value(horse.getTotalPoints()));
                    row.put("wins", value(horse.getTotalWins()));
                    row.put("races", value(horse.getTotalRaces()));
                    return row;
                }).toList();

        long pendingAccounts = users.stream().filter(user -> Set.of("PENDING", "PENDING_APPROVAL").contains(normalize(user.getStatus()))).count();
        long unassignedRaces = races.stream()
                .filter(race -> ACTIVE_RACE_STATUSES.contains(normalize(race.getStatus())) && race.getRefereeId() == null).count();
        long reportsReady = racesByStatus.getOrDefault("REPORT_READY", 0L);
        long openRewards = rewards.stream().filter(reward -> OPEN_REWARD_STATUSES.contains(reward.getStatus())).count();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", java.time.LocalDateTime.now());
        response.put("totals", totals);
        response.put("usersByRole", usersByRole);
        response.put("racesByStatus", racesByStatus);
        response.put("rewardsByStatus", rewardsByStatus);
        response.put("topHorses", topHorses);
        response.put("alerts", List.of(
                alert("Pending account reviews", pendingAccounts, "/dashboard/accounts", pendingAccounts > 0 ? "warning" : "ok"),
                alert("Races without referees", unassignedRaces, "/dashboard", unassignedRaces > 0 ? "danger" : "ok"),
                alert("Reports ready to finalize", reportsReady, "/dashboard/results", reportsReady > 0 ? "warning" : "ok"),
                alert("Rewards awaiting action", openRewards, "/dashboard/rewards", openRewards > 0 ? "warning" : "ok")
        ));
        return response;
    }

    private Map<String, Object> alert(String label, long count, String path, String tone) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("label", label);
        item.put("count", count);
        item.put("path", path);
        item.put("tone", tone);
        return item;
    }

    private void requireAdmin(String email) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (!"ADMIN".equals(normalize(user.getRole())) || !isActive(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only an active Admin can view analytics");
        }
    }

    private boolean isActive(User user) {
        return Set.of("VERIFIED", "ACTIVE").contains(normalize(user.getStatus()));
    }

    private String normalize(String value) {
        return value == null ? "UNKNOWN" : value.toUpperCase(Locale.ROOT);
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }
}

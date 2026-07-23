package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.RaceResult;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.RaceResultRepository;
import com.equix.horseracingsystem.repository.TournamentRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TournamentStandingService {

    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final RaceResultRepository resultRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    public TournamentStandingService(TournamentRepository tournamentRepository,
                                     RaceRepository raceRepository,
                                     RaceResultRepository resultRepository,
                                     HorseRepository horseRepository,
                                     UserRepository userRepository) {
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.resultRepository = resultRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> standings(Long tournamentId) {
        tournamentRepository.findById(tournamentId)
                .filter(tournament -> tournament.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament not found"));

        Map<Long, Race> officialRaces = raceRepository.findByTournamentId(tournamentId).stream()
                .filter(race -> race.getDeletedAt() == null && "OFFICIAL".equalsIgnoreCase(race.getStatus()))
                .collect(Collectors.toMap(Race::getId, race -> race));
        Set<Long> officialRaceIds = officialRaces.keySet();
        Map<Long, StandingAccumulator> grouped = new HashMap<>();

        List<RaceResult> officialResults = resultRepository.findAll().stream()
                .filter(result -> officialRaceIds.contains(result.getRaceId()))
                .filter(result -> Boolean.TRUE.equals(result.getOfficial()))
                .filter(result -> !Boolean.TRUE.equals(result.getDnf()) && !Boolean.TRUE.equals(result.getDisqualified()))
                .toList();
        Map<Long, Map<Long, BigDecimal>> prizeAllocations = officialResults.stream()
                .collect(Collectors.groupingBy(RaceResult::getRaceId)).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                        entry -> prizeAllocations(officialRaces.get(entry.getKey()), entry.getValue())));
        officialResults.forEach(result -> grouped.computeIfAbsent(result.getHorseId(), StandingAccumulator::new)
                .accept(result, prizeAllocations.getOrDefault(result.getRaceId(), Map.of())
                        .getOrDefault(result.getHorseId(), BigDecimal.ZERO)));

        List<StandingAccumulator> ordered = new ArrayList<>(grouped.values());
        ordered.sort(Comparator.comparingInt(StandingAccumulator::points).reversed()
                .thenComparing(Comparator.comparingInt(StandingAccumulator::wins).reversed())
                .thenComparing(Comparator.comparingInt(StandingAccumulator::seconds).reversed())
                .thenComparing(Comparator.comparingInt(StandingAccumulator::thirds).reversed())
                .thenComparing(Comparator.comparingInt(StandingAccumulator::racesEntered).reversed())
                .thenComparing(StandingAccumulator::prizeMoney, Comparator.reverseOrder())
                .thenComparingLong(StandingAccumulator::horseId));

        List<Map<String, Object>> response = new ArrayList<>();
        for (int index = 0; index < ordered.size(); index++) {
            StandingAccumulator standing = ordered.get(index);
            Horse horse = horseRepository.findById(standing.horseId()).orElse(null);
            User owner = horse == null || horse.getOwnerId() == null
                    ? null : userRepository.findById(horse.getOwnerId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", index + 1);
            row.put("horseId", standing.horseId());
            row.put("horseName", horse == null ? "Horse #" + standing.horseId() : horse.getHorseName());
            row.put("horseImageUrl", horse == null ? null : horse.getImageUrl());
            row.put("ownerId", horse == null ? null : horse.getOwnerId());
            row.put("ownerName", owner == null ? "Unknown owner" : owner.getFullName());
            row.put("totalRaces", standing.racesEntered());
            row.put("totalWins", standing.wins());
            row.put("secondPlaces", standing.seconds());
            row.put("thirdPlaces", standing.thirds());
            row.put("totalTop3", standing.wins() + standing.seconds() + standing.thirds());
            row.put("totalPoints", standing.points());
            row.put("prizeMoney", standing.prizeMoney());
            response.add(row);
        }
        return response;
    }

    private Map<Long, BigDecimal> prizeAllocations(Race race, List<RaceResult> results) {
        if (race == null) return Map.of();
        BigDecimal pool = race.getPrizePool() == null ? BigDecimal.ZERO : race.getPrizePool();
        BigDecimal first = pool.multiply(new BigDecimal("0.60")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal second = pool.multiply(new BigDecimal("0.30")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal third = pool.subtract(first).subtract(second);
        Map<Integer, BigDecimal> tiers = Map.of(1, first, 2, second, 3, third);
        Map<Long, BigDecimal> allocations = new HashMap<>();
        results.stream().filter(result -> result.getFinishPosition() != null && result.getFinishPosition() <= 3)
                .collect(Collectors.groupingBy(RaceResult::getFinishPosition)).forEach((position, tied) -> {
                    BigDecimal combined = BigDecimal.ZERO;
                    for (int occupied = position; occupied < position + tied.size(); occupied++) {
                        combined = combined.add(tiers.getOrDefault(occupied, BigDecimal.ZERO));
                    }
                    BigDecimal each = combined.divide(BigDecimal.valueOf(tied.size()), 0, RoundingMode.HALF_UP);
                    tied.forEach(result -> allocations.put(result.getHorseId(), each));
                });
        return allocations;
    }

    private static final class StandingAccumulator {
        private final long horseId;
        private final Set<Long> raceIds = new java.util.HashSet<>();
        private int points;
        private int wins;
        private int seconds;
        private int thirds;
        private BigDecimal prizeMoney = BigDecimal.ZERO;

        private StandingAccumulator(long horseId) {
            this.horseId = horseId;
        }

        private void accept(RaceResult result, BigDecimal allocatedPrize) {
            raceIds.add(result.getRaceId());
            points += result.getPointsAwarded() == null ? 0 : result.getPointsAwarded();
            if (Integer.valueOf(1).equals(result.getFinishPosition())) wins++;
            if (Integer.valueOf(2).equals(result.getFinishPosition())) seconds++;
            if (Integer.valueOf(3).equals(result.getFinishPosition())) thirds++;
            prizeMoney = prizeMoney.add(allocatedPrize);
        }

        private long horseId() { return horseId; }
        private int racesEntered() { return raceIds.size(); }
        private int points() { return points; }
        private int wins() { return wins; }
        private int seconds() { return seconds; }
        private int thirds() { return thirds; }
        private BigDecimal prizeMoney() { return prizeMoney; }
    }
}

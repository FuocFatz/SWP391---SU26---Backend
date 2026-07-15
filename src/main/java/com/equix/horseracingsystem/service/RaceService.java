package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.RaceRequest;
import com.equix.horseracingsystem.dto.RaceResponse;
import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.TournamentRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.lang.NonNull;

@Service
@SuppressWarnings("null")
public class RaceService {

    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    public RaceService(RaceRepository raceRepository, TournamentRepository tournamentRepository, UserRepository userRepository) {
        this.raceRepository = raceRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
    }

    public List<RaceResponse> getAllRaces(Long tournamentId, Long refereeId, String status) {
        List<Race> races;
        if (tournamentId != null) {
            races = raceRepository.findByTournamentId(tournamentId);
        } else if (refereeId != null) {
            races = raceRepository.findByRefereeId(refereeId);
        } else if (status != null && !status.isBlank()) {
            races = raceRepository.findByStatus(com.equix.horseracingsystem.enums.RaceStatus.valueOf(status.toUpperCase()));
        } else {
            races = raceRepository.findAll();
        }
        return races.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public RaceResponse getRaceById(@NonNull Long id) {
        Race race = raceRepository.findById(id).orElseThrow(() -> new RuntimeException("Race not found: " + id));
        return mapToResponse(race);
    }

    public RaceResponse createRace(RaceRequest request) {
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        User referee = null;
        if (request.getRefereeId() != null) {
            referee = userRepository.findById(request.getRefereeId())
                    .orElseThrow(() -> new RuntimeException("Referee not found"));
        }

        Race race = new Race();
        race.setTournament(tournament);
        race.setName(request.getRaceName());
        race.setType(com.equix.horseracingsystem.enums.RaceType.valueOf(request.getRaceType()));
        race.setDistanceM(request.getRaceDistance());
        race.setSurface(request.getTrackCondition());
        race.setRaceDate(request.getRaceDate());
        race.setRaceTime(request.getRaceTime());
        race.setRegistrationDeadline(request.getRegistrationDeadline());
        race.setMaxParticipants(request.getTotalLanes());
        race.setPrizePool(request.getPrizePoints());
        race.setWeather(request.getWeather());
        race.setLocation(request.getLocation());
        race.setReferee(referee);

        Race saved = raceRepository.save(race);
        return mapToResponse(saved);
    }

    public RaceResponse updateRace(@NonNull Long id, RaceRequest request) {
        Race existing = raceRepository.findById(id).orElseThrow(() -> new RuntimeException("Race not found: " + id));
        
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        User referee = null;
        if (request.getRefereeId() != null) {
            referee = userRepository.findById(request.getRefereeId())
                    .orElseThrow(() -> new RuntimeException("Referee not found"));
        }

        existing.setTournament(tournament);
        existing.setName(request.getRaceName());
        existing.setType(com.equix.horseracingsystem.enums.RaceType.valueOf(request.getRaceType()));
        existing.setDistanceM(request.getRaceDistance());
        existing.setSurface(request.getTrackCondition());
        existing.setRaceDate(request.getRaceDate());
        existing.setRaceTime(request.getRaceTime());
        existing.setRegistrationDeadline(request.getRegistrationDeadline());
        existing.setMaxParticipants(request.getTotalLanes());
        existing.setPrizePool(request.getPrizePoints());
        existing.setWeather(request.getWeather());
        existing.setLocation(request.getLocation());
        existing.setReferee(referee);

        Race saved = raceRepository.save(existing);
        return mapToResponse(saved);
    }

    public RaceResponse updateStatus(@NonNull Long id, String status) {
        Race race = raceRepository.findById(id).orElseThrow(() -> new RuntimeException("Race not found: " + id));
        race.setStatus(com.equix.horseracingsystem.enums.RaceStatus.valueOf(status.toUpperCase()));
        Race saved = raceRepository.save(race);
        return mapToResponse(saved);
    }

    public RaceResponse mapToResponse(Race race) {
        return RaceResponse.builder()
                .id(race.getId())
                .tournamentId(race.getTournament() != null ? race.getTournament().getId() : null)
                .name(race.getName())
                .type(race.getType() != null ? race.getType().name() : null)
                .distanceM(race.getDistanceM())
                .surface(race.getSurface())
                .raceDate(race.getRaceDate())
                .raceTime(race.getRaceTime())
                .registrationDeadline(race.getRegistrationDeadline())
                .maxParticipants(race.getMaxParticipants())
                .prizePool(race.getPrizePool())
                .weather(race.getWeather())
                .location(race.getLocation())
                .status(race.getStatus() != null ? race.getStatus().name() : null)
                .refereeId(race.getReferee() != null ? race.getReferee().getId() : null)
                .build();
    }
}

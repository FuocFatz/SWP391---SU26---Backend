package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.TournamentRequest;
import com.equix.horseracingsystem.dto.TournamentResponse;
import com.equix.horseracingsystem.dto.RaceResponse;
import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final RaceService raceService;

    public TournamentService(TournamentRepository tournamentRepository, RaceService raceService) {
        this.tournamentRepository = tournamentRepository;
        this.raceService = raceService;
    }

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
        return mapToResponse(tournament);
    }

    public TournamentResponse createTournament(TournamentRequest request) {
        Tournament tournament = new Tournament();
        tournament.setName(request.getName());
        tournament.setDescription(request.getDescription());
        tournament.setLocation(request.getLocation());
        tournament.setGracePeriodHours(request.getGracePeriodHours());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        
        Tournament saved = tournamentRepository.save(tournament);
        return mapToResponse(saved);
    }

    public TournamentResponse updateTournament(Long id, TournamentRequest request) {
        Tournament existing = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
        
        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setLocation(request.getLocation());
        existing.setGracePeriodHours(request.getGracePeriodHours());
        existing.setStartDate(request.getStartDate());
        existing.setEndDate(request.getEndDate());
        
        Tournament saved = tournamentRepository.save(existing);
        return mapToResponse(saved);
    }

    public List<RaceResponse> getRacesByTournamentId(Long tournamentId) {
        return raceService.getAllRaces(tournamentId, null, null);
    }

    private TournamentResponse mapToResponse(Tournament tournament) {
        return TournamentResponse.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .description(tournament.getDescription())
                .location(tournament.getLocation())
                .gracePeriodHours(tournament.getGracePeriodHours())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .status(tournament.getStatus() != null ? tournament.getStatus().name() : null)
                .createdAt(tournament.getCreatedAt())
                .updatedAt(tournament.getUpdatedAt())
                .deletedAt(tournament.getDeletedAt())
                .build();
    }
}

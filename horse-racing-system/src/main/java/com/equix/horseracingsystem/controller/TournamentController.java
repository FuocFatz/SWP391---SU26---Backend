package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Tournament;
import com.equix.horseracingsystem.repository.TournamentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin("*")
@SuppressWarnings("null")
public class TournamentController {

    private final TournamentRepository tournamentRepository;

    public TournamentController(TournamentRepository tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }

    @GetMapping
    public List<Tournament> getAll() {
        return tournamentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Tournament getById(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
    }

    @PostMapping
    public Tournament create(@RequestBody Tournament tournament) {
        return tournamentRepository.save(tournament);
    }

    @PutMapping("/{id}")
    public Tournament update(@PathVariable Long id, @RequestBody Tournament tournament) {
        Tournament existing = getById(id);
        existing.setName(tournament.getName());
        existing.setDescription(tournament.getDescription());
        existing.setLocation(tournament.getLocation());
        existing.setStartDate(tournament.getStartDate());
        existing.setEndDate(tournament.getEndDate());
        existing.setStatus(tournament.getStatus());
        return tournamentRepository.save(existing);
    }
}

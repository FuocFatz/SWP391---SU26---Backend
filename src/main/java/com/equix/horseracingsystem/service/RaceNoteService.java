package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.RaceNote;
import com.equix.horseracingsystem.repository.RaceNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class RaceNoteService {

    private final RaceNoteRepository raceNoteRepository;

    public RaceNoteService(RaceNoteRepository raceNoteRepository) {
        this.raceNoteRepository = raceNoteRepository;
    }

    public List<RaceNote> getNotesByRaceId(Long raceId) {
        return raceNoteRepository.findByRaceId(raceId);
    }

    public RaceNote createNote(RaceNote note) {
        return raceNoteRepository.save(note);
    }

    public void deleteNote(Long id) {
        raceNoteRepository.deleteById(id);
    }
}

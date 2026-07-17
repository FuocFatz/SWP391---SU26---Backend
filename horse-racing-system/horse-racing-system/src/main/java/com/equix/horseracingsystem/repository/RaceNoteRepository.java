package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RaceNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaceNoteRepository extends JpaRepository<RaceNote, Long> {
    List<RaceNote> findByRaceIdOrderByCreatedAtAsc(Long raceId);
}

package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Race;
import com.equix.horseracingsystem.enums.RaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RaceRepository extends JpaRepository<Race, Long> {
    List<Race> findByTournamentId(Long tournamentId);
    List<Race> findByRefereeId(Long refereeId);
    List<Race> findByStatus(RaceStatus status);
}

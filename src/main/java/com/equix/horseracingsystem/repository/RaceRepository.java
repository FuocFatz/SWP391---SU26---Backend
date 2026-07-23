package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaceRepository extends JpaRepository<Race, Long> {
    List<Race> findByTournamentId(Long tournamentId);
    List<Race> findByTournamentIdAndDeletedAtIsNull(Long tournamentId);
    List<Race> findByRefereeId(Long refereeId);
    List<Race> findByRefereeIdAndDeletedAtIsNull(Long refereeId);
    List<Race> findByStatus(String status);
    List<Race> findByStatusAndDeletedAtIsNull(String status);
    List<Race> findByDeletedAtIsNull();
}

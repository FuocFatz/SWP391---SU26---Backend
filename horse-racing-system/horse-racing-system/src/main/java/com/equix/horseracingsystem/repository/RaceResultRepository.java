package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {
    List<RaceResult> findByRaceIdOrderByFinishPositionAsc(Long raceId);
    List<RaceResult> findByHorseId(Long horseId);
    List<RaceResult> findByJockeyId(Long jockeyId);
}

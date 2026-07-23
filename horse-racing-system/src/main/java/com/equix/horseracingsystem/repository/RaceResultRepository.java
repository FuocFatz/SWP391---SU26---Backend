package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {
    @Query("""
            select result from RaceResult result
            where result.raceId = :raceId
            order by case when result.finishPosition is null then 1 else 0 end,
                     result.finishPosition asc,
                     result.id asc
            """)
    List<RaceResult> findByRaceIdOrderByFinishPositionAsc(@Param("raceId") Long raceId);
    List<RaceResult> findByHorseId(Long horseId);
    List<RaceResult> findByJockeyId(Long jockeyId);
    Optional<RaceResult> findByRaceIdAndRegistrationId(Long raceId, Long registrationId);
}

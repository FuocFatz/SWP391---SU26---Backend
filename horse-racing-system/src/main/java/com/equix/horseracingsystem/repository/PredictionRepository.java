package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByRaceId(Long raceId);
    List<Prediction> findBySpectatorId(Long spectatorId);
    List<Prediction> findBySpectatorIdAndRaceId(Long spectatorId, Long raceId);
    Optional<Prediction> findFirstBySpectatorIdAndRaceId(Long spectatorId, Long raceId);
}

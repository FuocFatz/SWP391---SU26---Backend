package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByRaceId(Long raceId);
    List<Prediction> findBySpectatorId(Long spectatorId);
}

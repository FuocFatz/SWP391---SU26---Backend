package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RaceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RaceRegistrationRepository extends JpaRepository<RaceRegistration, Long> {
    List<RaceRegistration> findByRaceId(Long raceId);
    List<RaceRegistration> findByOwnerId(Long ownerId);
    List<RaceRegistration> findByJockeyId(Long jockeyId);
    List<RaceRegistration> findByStatus(String status);
    Optional<RaceRegistration> findByRaceIdAndHorseId(Long raceId, Long horseId);
    boolean existsByRaceIdAndHorseId(Long raceId, Long horseId);
    Optional<RaceRegistration> findByIdAndDeletedAtIsNull(Long id);
}

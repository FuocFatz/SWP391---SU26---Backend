package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.JockeyInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Long> {
    List<JockeyInvitation> findByJockeyId(Long jockeyId);
    List<JockeyInvitation> findByOwnerId(Long ownerId);
    List<JockeyInvitation> findByRaceId(Long raceId);
    boolean existsByHorseIdAndStatus(Long horseId, String status);
    boolean existsByJockeyIdAndStatus(Long jockeyId, String status);
}

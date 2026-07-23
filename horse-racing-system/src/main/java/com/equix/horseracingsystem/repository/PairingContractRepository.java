package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.PairingContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PairingContractRepository extends JpaRepository<PairingContract, Long> {
    boolean existsByHorseIdAndStatus(Long horseId, String status);
    boolean existsByJockeyIdAndStatus(Long jockeyId, String status);
    boolean existsByOwnerIdAndStatus(Long ownerId, String status);
    Optional<PairingContract> findByHorseIdAndOwnerIdAndStatus(Long horseId, Long ownerId, String status);
}

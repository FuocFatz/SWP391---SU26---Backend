package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.PairingContract;
import com.equix.horseracingsystem.enums.PairingContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PairingContractRepository extends JpaRepository<PairingContract, Long> {
    List<PairingContract> findByHorseId(Long horseId);
    List<PairingContract> findByJockeyId(Long jockeyId);
    List<PairingContract> findByStatus(PairingContractStatus status);
}

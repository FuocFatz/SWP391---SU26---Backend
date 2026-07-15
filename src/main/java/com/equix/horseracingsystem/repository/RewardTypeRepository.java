package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RewardType;
import com.equix.horseracingsystem.enums.RewardName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RewardTypeRepository extends JpaRepository<RewardType, Integer> {
    Optional<RewardType> findByName(RewardName name);
}

package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RewardType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardTypeRepository extends JpaRepository<RewardType, Integer> {
    Optional<RewardType> findByNameIgnoreCase(String name);
    List<RewardType> findAllByOrderByIdAsc();
}

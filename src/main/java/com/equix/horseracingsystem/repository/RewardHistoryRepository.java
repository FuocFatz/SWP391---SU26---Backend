package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RewardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
    List<RewardHistory> findByUserId(Long userId);
}

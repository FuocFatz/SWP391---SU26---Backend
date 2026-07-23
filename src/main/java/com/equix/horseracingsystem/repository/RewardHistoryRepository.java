package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.RewardHistory;
import com.equix.horseracingsystem.entity.RewardStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
    Optional<RewardHistory> findByIdAndUserId(Long id, Long userId);
    Optional<RewardHistory> findByPredictionId(Long predictionId);
    List<RewardHistory> findByUserIdOrderByAwardedAtDesc(Long userId);
    List<RewardHistory> findAllByOrderByAwardedAtDesc();
    List<RewardHistory> findByStatusInAndExpiresAtBefore(Collection<RewardStatus> statuses, LocalDateTime expiresAt);
    boolean existsByRedemptionCodeIgnoreCase(String redemptionCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reward from RewardHistory reward where upper(reward.redemptionCode) = upper(:code)")
    Optional<RewardHistory> findByRedemptionCodeForUpdate(@Param("code") String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reward from RewardHistory reward where reward.id = :id")
    Optional<RewardHistory> findByIdForUpdate(@Param("id") Long id);
}

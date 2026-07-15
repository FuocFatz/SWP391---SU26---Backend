package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.RewardHistory;
import com.equix.horseracingsystem.repository.RewardHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class RewardService {

    private final RewardHistoryRepository rewardHistoryRepository;

    public RewardService(RewardHistoryRepository rewardHistoryRepository) {
        this.rewardHistoryRepository = rewardHistoryRepository;
    }

    public List<RewardHistory> getRewardsByUserId(Long userId) {
        return rewardHistoryRepository.findByUserId(userId);
    }

    public RewardHistory createReward(RewardHistory reward) {
        return rewardHistoryRepository.save(reward);
    }
}

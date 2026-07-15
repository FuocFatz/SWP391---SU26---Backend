package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.RewardHistory;
import com.equix.horseracingsystem.entity.RewardType;
import com.equix.horseracingsystem.repository.RewardTypeRepository;
import com.equix.horseracingsystem.service.RewardService;
import com.equix.horseracingsystem.util.SecurityUtil;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rewards")
@CrossOrigin("*")
@Tag(name = "Rewards")
@SuppressWarnings("null")
public class RewardController {
    private final RewardTypeRepository typeRepository;
    private final RewardService service;
    private final SecurityUtil securityUtil;

    public RewardController(RewardTypeRepository typeRepository, RewardService service, SecurityUtil securityUtil) {
        this.typeRepository = typeRepository;
        this.service = service;
        this.securityUtil = securityUtil;
    }

    @GetMapping("/types")
    public List<RewardType> getTypes() {
        return typeRepository.findAll();
    }

    @PostMapping("/types")
    public RewardType createType(@RequestBody RewardType type) {
        return typeRepository.save(type);
    }

    @PostMapping("/redeem")
    public RewardHistory redeem(@RequestBody RewardHistory request) {
        // Logic will be in service, but mapped here temporarily
        return service.createReward(request);
    }

    @GetMapping("/my-history")
    public List<RewardHistory> myHistory() {
        return service.getRewardsByUserId(securityUtil.getCurrentUserId());
    }
}

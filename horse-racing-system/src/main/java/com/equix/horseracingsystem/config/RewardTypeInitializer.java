package com.equix.horseracingsystem.config;

import com.equix.horseracingsystem.entity.RewardType;
import com.equix.horseracingsystem.repository.RewardTypeRepository;
import com.equix.horseracingsystem.service.RewardService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(150)
public class RewardTypeInitializer implements CommandLineRunner {

    private final RewardTypeRepository rewardTypeRepository;

    public RewardTypeInitializer(RewardTypeRepository rewardTypeRepository) {
        this.rewardTypeRepository = rewardTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        createIfMissing(RewardService.HORSE_GOODS,
                "Branded horse merchandise delivered to the winning spectator", 90, true);
        createIfMissing(RewardService.VOUCHER,
                "Voucher for EquiX merchandise or future race access", 30, false);
        createIfMissing(RewardService.DRINK_COUPON,
                "Complimentary drink coupon for an event or partner venue", 30, false);
    }

    private void createIfMissing(String name, String description, int validityDays, boolean requiresShipping) {
        if (rewardTypeRepository.findByNameIgnoreCase(name).isPresent()) return;
        rewardTypeRepository.save(RewardType.builder()
                .name(name)
                .description(description)
                .active(true)
                .validityDays(validityDays)
                .requiresShipping(requiresShipping)
                .build());
    }
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.RewardClaimRequest;
import com.equix.horseracingsystem.dto.PointRewardExchangeRequest;
import com.equix.horseracingsystem.dto.RewardCatalogItemResponse;
import com.equix.horseracingsystem.dto.RewardCodeRedeemRequest;
import com.equix.horseracingsystem.dto.RewardResponse;
import com.equix.horseracingsystem.service.RewardService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@PreAuthorize("hasRole('SPECTATOR')")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    public List<RewardResponse> getMine(Principal principal,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) Long raceId,
                                        @RequestParam(required = false) String type) {
        return rewardService.listMine(principal.getName(), status, raceId, type);
    }

    @GetMapping("/catalog")
    public List<RewardCatalogItemResponse> getPointCatalog(Principal principal) {
        return rewardService.listPointCatalog(principal.getName());
    }

    @PostMapping("/exchange")
    public RewardResponse exchangePoints(Principal principal,
                                         @Valid @RequestBody PointRewardExchangeRequest request) {
        return rewardService.exchangePoints(principal.getName(), request);
    }

    @GetMapping("/{id}")
    public RewardResponse getMineById(Principal principal, @PathVariable Long id) {
        return rewardService.getMine(principal.getName(), id);
    }

    @PostMapping("/{id}/claim")
    public RewardResponse claim(Principal principal, @PathVariable Long id,
                                @Valid @RequestBody RewardClaimRequest request) {
        return rewardService.claim(principal.getName(), id, request);
    }

    @PostMapping("/{id}/confirm-received")
    public RewardResponse confirmReceived(Principal principal, @PathVariable Long id) {
        return rewardService.confirmReceived(principal.getName(), id);
    }

    @PostMapping("/redeem-code")
    public RewardResponse redeemCode(Principal principal,
                                     @Valid @RequestBody RewardCodeRedeemRequest request) {
        return rewardService.redeemCode(principal.getName(), request);
    }
}

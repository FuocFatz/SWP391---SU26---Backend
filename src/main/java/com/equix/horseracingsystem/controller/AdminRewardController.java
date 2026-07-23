package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.RewardType;
import com.equix.horseracingsystem.service.RewardService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/rewards")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRewardController {

    private final RewardService rewardService;

    public AdminRewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    public List<RewardResponse> getAll(Principal principal,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(required = false) Long raceId,
                                       @RequestParam(required = false) String type) {
        return rewardService.listAll(principal.getName(), status, raceId, type);
    }

    @GetMapping("/types")
    public List<RewardType> getTypes(Principal principal) {
        return rewardService.listTypes(principal.getName());
    }

    @PutMapping("/types/{id}")
    public RewardType updateType(Principal principal, @PathVariable Integer id,
                                 @Valid @RequestBody RewardTypeUpdateRequest request) {
        return rewardService.updateType(principal.getName(), id, request);
    }

    @PatchMapping("/{id}/fulfillment")
    public RewardResponse fulfill(Principal principal, @PathVariable Long id,
                                  @Valid @RequestBody RewardFulfillmentRequest request) {
        return rewardService.fulfill(principal.getName(), id, request);
    }

    @PostMapping("/redeem")
    public RewardResponse redeem(Principal principal,
                                 @Valid @RequestBody RewardRedeemRequest request) {
        return rewardService.redeem(principal.getName(), request);
    }

    @PostMapping("/codes")
    public RewardResponse createCode(Principal principal,
                                     @Valid @RequestBody RewardCodeCreateRequest request) {
        return rewardService.createCode(principal.getName(), request);
    }
}

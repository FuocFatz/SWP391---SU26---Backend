package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class PointRewardExchangeRequest {
    @NotNull
    @Positive
    private Integer rewardTypeId;
}

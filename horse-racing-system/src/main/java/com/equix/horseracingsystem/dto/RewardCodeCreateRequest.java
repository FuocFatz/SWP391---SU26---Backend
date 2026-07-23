package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RewardCodeCreateRequest {
    @NotNull
    private Long spectatorId;

    @NotNull
    private Integer rewardTypeId;

    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;

    @Min(1)
    @Max(3650)
    private Integer validityDays;

    @Size(max = 2000)
    private String adminNote;
}

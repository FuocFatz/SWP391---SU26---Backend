package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RewardTypeUpdateRequest {
    @Size(max = 255)
    private String description;

    private Boolean active;

    @Size(max = 1000)
    private String imageUrl;

    @Size(max = 1000)
    private String redemptionUrl;

    @Size(max = 255)
    private String partnerName;

    @Size(max = 1000)
    private String contactInfo;

    @Size(max = 2000)
    private String terms;

    @Min(1)
    private Integer validityDays;

    @Min(0)
    private Integer pointCost;

    private Boolean requiresShipping;
}

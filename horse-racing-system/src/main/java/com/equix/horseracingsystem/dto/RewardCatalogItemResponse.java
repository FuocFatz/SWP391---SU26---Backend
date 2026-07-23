package com.equix.horseracingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RewardCatalogItemResponse {
    private Integer id;
    private String name;
    private String description;
    private Integer pointCost;
    private Integer validityDays;
    private String imageUrl;
    private String partnerName;
    private String terms;
}

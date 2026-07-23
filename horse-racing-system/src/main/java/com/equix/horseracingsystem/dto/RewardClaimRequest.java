package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RewardClaimRequest {
    @Size(max = 255)
    private String recipientName;

    @Size(max = 50)
    private String recipientPhone;

    @Size(max = 1000)
    private String deliveryAddress;

    @Size(max = 1000)
    private String spectatorNote;
}

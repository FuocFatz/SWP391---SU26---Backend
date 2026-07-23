package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RewardFulfillmentRequest {
    @NotBlank
    private String action;

    @Size(max = 255)
    private String carrier;

    @Size(max = 255)
    private String trackingNumber;

    @Size(max = 2000)
    private String adminNote;
}

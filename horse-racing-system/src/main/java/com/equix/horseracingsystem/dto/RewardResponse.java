package com.equix.horseracingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class RewardResponse {
    private Long id;
    private Long userId;
    private Long predictionId;
    private Long raceId;
    private Long horseId;
    private Integer finishPosition;
    private Integer rewardTypeId;
    private String rewardType;
    private String rewardTypeDescription;
    private String status;
    private String title;
    private String description;
    private String redemptionCode;
    private String imageUrl;
    private String redemptionUrl;
    private String partnerName;
    private String contactInfo;
    private String terms;
    private Boolean requiresShipping;
    private LocalDateTime awardedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime claimedAt;
    private LocalDateTime processingAt;
    private LocalDateTime shippedAt;
    private LocalDateTime fulfilledAt;
    private LocalDateTime redeemedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime updatedAt;
    private String recipientName;
    private String recipientPhone;
    private String deliveryAddress;
    private String spectatorNote;
    private String carrier;
    private String trackingNumber;
    private String adminNote;
    private Integer pointsSpent;
    private boolean expired;
}

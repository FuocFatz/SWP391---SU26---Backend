package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reward_history", uniqueConstraints = {
        @UniqueConstraint(name = "uk_reward_history_prediction", columnNames = "prediction_id"),
        @UniqueConstraint(name = "uk_reward_history_redemption_code", columnNames = "redemption_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reward_type_id", nullable = false)
    private Integer rewardTypeId;

    @Column(name = "race_id")
    private Long raceId;

    @Column(columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "awarded_at", nullable = false)
    private LocalDateTime awardedAt;

    @Column(name = "prediction_id")
    private Long predictionId;

    @Column(name = "horse_id")
    private Long horseId;

    @Column(name = "finish_position")
    private Integer finishPosition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RewardStatus status;

    @Column(name = "redemption_code", length = 80)
    private String redemptionCode;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "snapshot_image_url", length = 1000)
    private String imageUrl;

    @Column(name = "snapshot_redemption_url", length = 1000)
    private String redemptionUrl;

    @Column(name = "snapshot_partner_name", length = 255)
    private String partnerName;

    @Column(name = "snapshot_contact_info", length = 1000)
    private String contactInfo;

    @Column(name = "snapshot_terms", length = 2000)
    private String terms;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "processing_at")
    private LocalDateTime processingAt;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "fulfilled_at")
    private LocalDateTime fulfilledAt;

    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "recipient_name", length = 255)
    private String recipientName;

    @Column(name = "recipient_phone", length = 50)
    private String recipientPhone;

    @Column(name = "delivery_address", length = 1000)
    private String deliveryAddress;

    @Column(name = "spectator_note", length = 1000)
    private String spectatorNote;

    @Column(length = 255)
    private String carrier;

    @Column(name = "tracking_number", length = 255)
    private String trackingNumber;

    @Column(name = "admin_note", length = 2000)
    private String adminNote;

    @Column(name = "points_spent", nullable = false)
    private Integer pointsSpent;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (awardedAt == null) awardedAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = RewardStatus.ISSUED;
        if (pointsSpent == null || pointsSpent < 0) pointsSpent = 0;
        if (title == null || title.isBlank()) {
            title = description == null || description.isBlank() ? "Reward" : description;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

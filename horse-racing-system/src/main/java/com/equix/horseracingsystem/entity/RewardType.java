package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reward_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 30, unique = true)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "redemption_url", length = 1000)
    private String redemptionUrl;

    @Column(name = "partner_name", length = 255)
    private String partnerName;

    @Column(name = "contact_info", length = 1000)
    private String contactInfo;

    @Column(length = 2000)
    private String terms;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays;

    @Column(name = "requires_shipping", nullable = false)
    private Boolean requiresShipping;

    @Column(name = "point_cost", nullable = false)
    private Integer pointCost;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (active == null) active = true;
        if (validityDays == null || validityDays < 1) validityDays = 30;
        if (requiresShipping == null) requiresShipping = false;
        if (pointCost == null || pointCost < 0) pointCost = 0;
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

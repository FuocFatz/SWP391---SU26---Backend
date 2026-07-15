package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reward_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_type_id", nullable = false)
    private RewardType rewardType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id")
    private Race race;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "awarded_at", updatable = false)
    private LocalDateTime awardedAt;

    @PrePersist
    void onCreate() {
        if (awardedAt == null) awardedAt = LocalDateTime.now();
    }
}

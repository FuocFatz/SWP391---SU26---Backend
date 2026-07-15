package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.PredictionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spectator_id", nullable = false)
    private User spectator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predicted_horse_id", nullable = false)
    private Horse predictedHorse;

    @Column(name = "wager_points")
    private Integer wagerPoints;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PredictionStatus status;

    @Column(name = "reward_points")
    private Integer rewardPoints;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (wagerPoints == null) wagerPoints = 0;
        if (rewardPoints == null) rewardPoints = 0;
        if (status == null) status = PredictionStatus.ACTIVE;
    }
}

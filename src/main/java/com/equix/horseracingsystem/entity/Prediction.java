package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "predictions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_prediction_spectator_race", columnNames = {"spectator_id", "race_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "race_id")
    private Long raceId;

    @Column(name = "spectator_id")
    private Long spectatorId;

    @Column(name = "predicted_horse_id")
    private Long predictedHorseId;

    @Column(name = "wager_points")
    private Integer wagerPoints;

    private String status;

    @Column(name = "reward_points")
    private Integer rewardPoints;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE"; // ACTIVE until locked/settled
        }
        if (rewardPoints == null) {
            rewardPoints = 0;
        }
        if (wagerPoints == null) {
            wagerPoints = 0;
        }
    }
}

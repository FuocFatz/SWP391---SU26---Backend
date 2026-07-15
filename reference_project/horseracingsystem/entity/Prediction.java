package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "predictions")
public class Prediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "spectator_id", nullable = false)
    private User spectator;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "predicted_horse_id", nullable = false)
    private Horse predictedHorse;

    @ColumnDefault("0")
    @Column(name = "wager_points")
    private Integer wagerPoints;

    @Size(max = 20)
    @Nationalized
    @ColumnDefault("'ACTIVE'")
    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("0")
    @Column(name = "reward_points")
    private Integer rewardPoints;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "settled_at")
    private Instant settledAt;


}
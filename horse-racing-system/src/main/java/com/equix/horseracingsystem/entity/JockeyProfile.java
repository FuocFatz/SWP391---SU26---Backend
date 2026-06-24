package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "jockey_profiles")
public class JockeyProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("0")
    @Column(name = "total_races")
    private Integer totalRaces;

    @ColumnDefault("0")
    @Column(name = "total_wins")
    private Integer totalWins;

    @ColumnDefault("0.00")
    @Column(name = "win_rate", precision = 5, scale = 2)
    private BigDecimal winRate;

    @Size(max = 20)
    @Nationalized
    @ColumnDefault("'AVAILABLE'")
    @Column(name = "availability_status", length = 20)
    private String availabilityStatus;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;


}
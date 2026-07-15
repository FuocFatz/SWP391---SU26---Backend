package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "race_results")
public class RaceResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registration_id", nullable = false)
    private RaceRegistration registration;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "finish_position")
    private Integer finishPosition;

    @Column(name = "finish_time_seconds", precision = 10, scale = 3)
    private BigDecimal finishTimeSeconds;

    @ColumnDefault("0")
    @Column(name = "points_awarded")
    private Integer pointsAwarded;

    @ColumnDefault("0")
    @Column(name = "dnf")
    private Boolean dnf;

    @ColumnDefault("0")
    @Column(name = "disqualified")
    private Boolean disqualified;

    @Nationalized
    @Lob
    @Column(name = "violation_notes")
    private String violationNotes;

    @ColumnDefault("1")
    @Column(name = "official")
    private Boolean official;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;


}
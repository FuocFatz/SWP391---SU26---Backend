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
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@Table(name = "races")
public class Race {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Size(max = 150)
    @NotNull
    @Nationalized
    @Column(name = "race_name", nullable = false, length = 150)
    private String raceName;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "race_type", nullable = false, length = 20)
    private String raceType;

    @NotNull
    @Column(name = "race_distance", nullable = false)
    private Integer raceDistance;

    @Size(max = 50)
    @Nationalized
    @ColumnDefault("'Turf'")
    @Column(name = "track_condition", length = 50)
    private String trackCondition;

    @NotNull
    @Column(name = "race_date", nullable = false)
    private LocalDate raceDate;

    @NotNull
    @Column(name = "race_time", nullable = false)
    private LocalTime raceTime;

    @NotNull
    @Column(name = "registration_deadline", nullable = false)
    private Instant registrationDeadline;

    @ColumnDefault("8")
    @Column(name = "total_lanes")
    private Integer totalLanes;

    @ColumnDefault("0.00")
    @Column(name = "prize_points", precision = 10, scale = 2)
    private BigDecimal prizePoints;

    @Size(max = 50)
    @Nationalized
    @Column(name = "weather", length = 50)
    private String weather;

    @Size(max = 150)
    @Nationalized
    @Column(name = "location", length = 150)
    private String location;

    @Size(max = 30)
    @Nationalized
    @ColumnDefault("'DRAFT'")
    @Column(name = "status", length = 30)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_id")
    private User referee;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;


}
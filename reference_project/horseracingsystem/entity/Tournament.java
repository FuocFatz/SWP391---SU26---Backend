package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "tournaments")
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Size(max = 150)
    @NotNull
    @Nationalized
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Nationalized
    @Lob
    @Column(name = "description")
    private String description;

    @Size(max = 150)
    @Nationalized
    @Column(name = "location", length = 150)
    private String location;

    @ColumnDefault("120")
    @Column(name = "grace_period_hours")
    private Integer gracePeriodHours;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Size(max = 20)
    @Nationalized
    @ColumnDefault("'OPEN'")
    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;


}
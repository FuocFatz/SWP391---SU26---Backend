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
@Table(name = "race_notes")
public class RaceNote {
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
    @JoinColumn(name = "referee_id", nullable = false)
    private User referee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private RaceRegistration registration;

    @Size(max = 30)
    @NotNull
    @Nationalized
    @Column(name = "note_category", nullable = false, length = 30)
    private String noteCategory;

    @Size(max = 20)
    @Nationalized
    @ColumnDefault("'INFO'")
    @Column(name = "severity", length = 20)
    private String severity;

    @NotNull
    @Nationalized
    @Lob
    @Column(name = "description", nullable = false)
    private String description;

    @Size(max = 100)
    @Nationalized
    @Column(name = "action_taken", length = 100)
    private String actionTaken;

    @Column(name = "race_time_seconds")
    private Integer raceTimeSeconds;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;


}
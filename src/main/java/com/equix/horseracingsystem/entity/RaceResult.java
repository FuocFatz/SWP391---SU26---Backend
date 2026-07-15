package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "race_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RaceResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Race race;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RaceRegistration registration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horse_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jockey_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User jockey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User owner;

    @Column(name = "finish_position")
    private Integer finishPosition;

    @Column(name = "finish_time_seconds", precision = 10, scale = 3)
    private BigDecimal finishTimeSeconds;

    @Column(name = "points_awarded")
    private Integer pointsAwarded;

    private Boolean dnf;

    private Boolean disqualified;

    @Column(name = "violation_notes", columnDefinition = "NVARCHAR(MAX)")
    private String violationNotes;

    private Boolean official;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (pointsAwarded == null) pointsAwarded = 0;
        if (dnf == null) dnf = false;
        if (disqualified == null) disqualified = false;
        if (official == null) official = true;
    }
}

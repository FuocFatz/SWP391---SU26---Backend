package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "race_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "race_id")
    private Long raceId;

    @Column(name = "registration_id")
    private Long registrationId;

    @Column(name = "horse_id")
    private Long horseId;

    @Column(name = "jockey_id")
    private Long jockeyId;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "finish_position")
    private Integer finishPosition;

    @Column(name = "finish_time_seconds")
    private BigDecimal finishTimeSeconds;

    @Column(name = "points_awarded")
    private Integer pointsAwarded;

    @Column(name = "violation_notes", length = 1000)
    private String violationNotes;

    private Boolean official;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (official == null) {
            official = true;
        }
        if (pointsAwarded == null) {
            pointsAwarded = 0;
        }
    }
}

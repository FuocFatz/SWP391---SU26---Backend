package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "race_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "race_id", nullable = false)
    private Long raceId;

    @Column(name = "referee_id", nullable = false)
    private Long refereeId;

    @Column(name = "registration_id")
    private Long registrationId;

    @Column(name = "note_category", nullable = false)
    private String noteCategory;

    private String severity;

    @Column(columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "action_taken")
    private String actionTaken;

    @Column(name = "race_time_seconds")
    private Integer raceTimeSeconds;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

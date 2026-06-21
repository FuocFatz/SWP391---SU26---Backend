package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "races")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Race {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tournament_id")
    private Long tournamentId;

    // DB column is named `race_name`
    @Column(name = "race_name")
    private String name;

    // `type` column not present in current DB schema; keeping as transient
    @Transient
    private String type;

    // map to DB column `race_distance`
    @Column(name = "race_distance")
    private Integer distanceM;

    // DB column is `track_condition`
    @Column(name = "track_condition")
    private String surface;

    @Column(name = "race_date")
    private LocalDate raceDate;

    // `race_time` column not present in current DB; keeping as transient
    @Transient
    private LocalTime raceTime;

    // DB uses `total_lanes` instead of `max_participants`
    @Column(name = "total_lanes")
    private Integer maxParticipants;

    // DB column is `prize_points` (INT type)
    @Column(name = "prize_points")
    private BigDecimal prizePool;

    // Additional DB columns that exist
    @Column(name = "weather")
    private String weather;

    @Column(name = "location")
    private String location;

    private String status;

    @Column(name = "referee_id")
    private Long refereeId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "REGISTRATION_OPEN";
        }
        if (type == null) {
            type = "Sprint";
        }
        if (surface == null) {
            surface = "Turf";
        }
        if (maxParticipants == null) {
            maxParticipants = 8;
        }
        if (prizePool == null) {
            prizePool = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

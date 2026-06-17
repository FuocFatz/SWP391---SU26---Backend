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

    private String name;

    private String type;

    @Column(name = "distance_m")
    private Integer distanceM;

    private String surface;

    @Column(name = "race_date")
    private LocalDate raceDate;

    @Column(name = "race_time")
    private LocalTime raceTime;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "prize_pool")
    private BigDecimal prizePool;

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

package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.RaceStatus;
import com.equix.horseracingsystem.enums.RaceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "races")
@SQLDelete(sql = "UPDATE races SET deleted_at = GETDATE() WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Race {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "race_name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "race_type", nullable = false, length = 20)
    private RaceType type;

    @Column(name = "race_distance", nullable = false)
    private Integer distanceM;

    @Column(name = "track_condition", length = 50)
    private String surface;

    @Column(name = "race_date", nullable = false)
    private LocalDate raceDate;

    @Column(name = "race_time", nullable = false)
    private LocalTime raceTime;

    @Column(name = "registration_deadline", nullable = false)
    private LocalDateTime registrationDeadline;

    @Column(name = "total_lanes")
    private Integer maxParticipants;

    @Column(name = "prize_points")
    private BigDecimal prizePool;

    @Column(length = 50)
    private String weather;

    @Column(length = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RaceStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_id")
    private User referee;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = RaceStatus.DRAFT;
        if (surface == null) surface = "Turf";
        if (maxParticipants == null) maxParticipants = 8;
        if (prizePool == null) prizePool = BigDecimal.ZERO;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

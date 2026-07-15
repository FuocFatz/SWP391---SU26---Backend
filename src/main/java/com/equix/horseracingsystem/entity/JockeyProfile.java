package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.JockeyAvailabilityStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "jockey_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JockeyProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_races")
    private Integer totalRaces;

    @Column(name = "total_wins")
    private Integer totalWins;

    @Column(name = "win_rate", precision = 5, scale = 2)
    private BigDecimal winRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", length = 20)
    private JockeyAvailabilityStatus availabilityStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (totalRaces == null) totalRaces = 0;
        if (totalWins == null) totalWins = 0;
        if (winRate == null) winRate = BigDecimal.ZERO;
        if (availabilityStatus == null) availabilityStatus = JockeyAvailabilityStatus.AVAILABLE;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

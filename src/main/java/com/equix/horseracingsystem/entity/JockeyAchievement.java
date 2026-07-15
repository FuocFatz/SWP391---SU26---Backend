package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jockey_achievements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JockeyAchievement {
    
    @EmbeddedId
    private JockeyAchievementId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("jockeyId")
    @JoinColumn(name = "jockey_id")
    private User jockey;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("achievementId")
    @JoinColumn(name = "achievement_id")
    private Achievement achievement;

    @Column(name = "awarded_at", updatable = false)
    private LocalDateTime awardedAt;

    @PrePersist
    void onCreate() {
        if (awardedAt == null) awardedAt = LocalDateTime.now();
    }
}

package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "jockey_achievements")
public class JockeyAchievement {
    @EmbeddedId
    private JockeyAchievementId id;

    @MapsId("jockeyId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @MapsId("achievementId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @ColumnDefault("getdate()")
    @Column(name = "awarded_at")
    private Instant awardedAt;


}
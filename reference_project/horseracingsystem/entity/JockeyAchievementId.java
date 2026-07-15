package com.equix.horseracingsystem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class JockeyAchievementId implements Serializable {
    private static final long serialVersionUID = -7622139496901650800L;
    @NotNull
    @Column(name = "jockey_id", nullable = false)
    private Long jockeyId;

    @NotNull
    @Column(name = "achievement_id", nullable = false)
    private Integer achievementId;


}
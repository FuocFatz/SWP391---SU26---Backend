package com.equix.horseracingsystem.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class JockeyAchievementId implements Serializable {
    private Long jockeyId;
    private Integer achievementId;
}

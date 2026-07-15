package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.JockeyAchievement;
import com.equix.horseracingsystem.entity.JockeyAchievementId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JockeyAchievementRepository extends JpaRepository<JockeyAchievement, JockeyAchievementId> {
    List<JockeyAchievement> findByJockeyId(Long jockeyId);
}

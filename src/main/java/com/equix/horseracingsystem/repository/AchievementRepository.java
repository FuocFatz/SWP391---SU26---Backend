package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Integer> {
    Optional<Achievement> findByName(String name);
}

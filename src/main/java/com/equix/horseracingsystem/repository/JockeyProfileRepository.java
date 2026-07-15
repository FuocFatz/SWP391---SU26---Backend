package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.JockeyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JockeyProfileRepository extends JpaRepository<JockeyProfile, Long> {
    Optional<JockeyProfile> findByUserId(Long userId);
}

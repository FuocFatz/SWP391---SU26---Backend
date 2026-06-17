package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorseRepository extends JpaRepository<Horse, Long> {
    List<Horse> findByOwnerId(Long ownerId);
}

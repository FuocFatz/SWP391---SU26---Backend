package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorseRepository extends JpaRepository<Horse, Long> {
}
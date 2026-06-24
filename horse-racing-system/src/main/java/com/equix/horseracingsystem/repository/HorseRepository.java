package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorseRepository extends JpaRepository<Horse, Long> {
    List<Horse> findByOwnerId(Long ownerId);
}
package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HorseRepository extends JpaRepository<Horse, Long> {
    List<Horse> findByOwnerId(Long ownerId);
    List<Horse> findByDeletedAtIsNull();
    List<Horse> findByOwnerIdAndDeletedAtIsNull(Long ownerId);
    Optional<Horse> findByIdAndDeletedAtIsNull(Long id);
}

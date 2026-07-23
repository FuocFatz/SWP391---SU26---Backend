package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByDeletedAtIsNull();
    Optional<Tournament> findByIdAndDeletedAtIsNull(Long id);
}

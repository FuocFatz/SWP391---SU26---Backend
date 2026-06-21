package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
}

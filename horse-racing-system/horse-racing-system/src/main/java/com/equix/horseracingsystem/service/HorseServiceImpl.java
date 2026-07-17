package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.repository.HorseRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class HorseServiceImpl implements HorseService {

    private final HorseRepository repo;

    public HorseServiceImpl(HorseRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Horse> getAll() {
        return repo.findByDeletedAtIsNull();
    }

    @Override
    public List<Horse> getByOwner(@NonNull Long ownerId) {
        return repo.findByOwnerIdAndDeletedAtIsNull(ownerId);
    }

    @Override
    public Horse getById(@NonNull Long id) {
        return repo.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Horse not found: " + id));
    }

    @Override
    public Horse create(@NonNull Horse horse) {
        if (horse.getRegistrationNumber() == null || horse.getRegistrationNumber().isBlank()) {
            horse.setRegistrationNumber("EQX-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        }
        if (horse.getGender() == null || horse.getGender().isBlank()) horse.setGender("UNKNOWN");
        return repo.save(horse);
    }

    @Override
    public Horse update(@NonNull Long id, Horse horse) {
        Horse h = getById(id);

        h.setHorseName(horse.getHorseName());
        h.setNickname(horse.getNickname());
        h.setRegistrationNumber(horse.getRegistrationNumber());
        h.setGender(horse.getGender());
        h.setBreed(horse.getBreed());
        h.setAge(horse.getAge());
        h.setColor(horse.getColor());
        h.setCountryOfOrigin(horse.getCountryOfOrigin());
        h.setHeightCm(horse.getHeightCm());
        h.setWeightKg(horse.getWeightKg());
        h.setSpeed(horse.getSpeed());
        h.setStamina(horse.getStamina());
        h.setAcceleration(horse.getAcceleration());
        h.setAgility(horse.getAgility());
        h.setPaceStyle(horse.getPaceStyle());
        h.setHealthStatus(horse.getHealthStatus());
        h.setInjuryNotes(horse.getInjuryNotes());
        if (horse.getStatus() != null && !horse.getStatus().equals(h.getStatus())) {
            if ("REGISTERED".equalsIgnoreCase(h.getStatus())) {
                throw new RuntimeException("A registered horse must be withdrawn through the race workflow");
            }
            h.setStatus(horse.getStatus().toUpperCase());
        }
        h.setImageUrl(horse.getImageUrl());
        h.setDescription(horse.getDescription());

        return repo.save(h);
    }

    @Override
    public void delete(@NonNull Long id) {
        Horse horse = getById(id);
        horse.setDeletedAt(LocalDateTime.now());
        repo.save(horse);
    }
}

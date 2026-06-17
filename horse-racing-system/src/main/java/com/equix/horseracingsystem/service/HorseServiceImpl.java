package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.repository.HorseRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HorseServiceImpl implements HorseService {

    private final HorseRepository repo;

    public HorseServiceImpl(HorseRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Horse> getAll() {
        return repo.findAll();
    }

    @Override
    public Horse getById(@NonNull Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Horse not found: " + id));
    }

    @Override
    public Horse create(@NonNull Horse horse) {
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

        return repo.save(h);
    }

    @Override
    public void delete(@NonNull Long id) {
        repo.deleteById(id);
    }
}
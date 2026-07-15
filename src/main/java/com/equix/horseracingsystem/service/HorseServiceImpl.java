package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.HorseCreateRequest;
import com.equix.horseracingsystem.dto.HorseResponse;
import com.equix.horseracingsystem.dto.HorseUpdateRequest;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.enums.HorseGender;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class HorseServiceImpl implements HorseService {

    private final HorseRepository repo;
    private final UserRepository userRepository;

    public HorseServiceImpl(HorseRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    private HorseResponse mapToResponse(Horse horse) {
        return HorseResponse.builder()
                .id(horse.getId())
                .horseName(horse.getHorseName())
                .registrationNumber(horse.getRegistrationNumber())
                .gender(horse.getGender() != null ? horse.getGender().name() : null)
                .ownerId(horse.getOwner() != null ? horse.getOwner().getId() : null)
                .ownerName(horse.getOwner() != null ? horse.getOwner().getFullName() : null)
                .status(horse.getStatus() != null ? horse.getStatus().name() : null)
                .breed(horse.getBreed())
                .healthStatus(horse.getHealthStatus())
                .speed(horse.getSpeed())
                .stamina(horse.getStamina())
                .totalWins(horse.getTotalWins() != null ? horse.getTotalWins() : 0)
                .totalRaces(horse.getTotalRaces() != null ? horse.getTotalRaces() : 0)
                .build();
    }

    @Override
    public List<HorseResponse> getAll() {
        return repo.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public List<HorseResponse> getByOwner(@NonNull Long ownerId) {
        return repo.findByOwnerId(ownerId).stream().map(this::mapToResponse).toList();
    }

    @Override
    public HorseResponse getById(@NonNull Long id) {
        return repo.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Horse not found: " + id));
    }

    @Override
    public HorseResponse create(@NonNull HorseCreateRequest request) {
        return createFromDto(request); // delegating to existing logic, but we'll adapt it
    }

    private HorseResponse createFromDto(@NonNull HorseCreateRequest request) {
        // Validate owner
        if (request.getOwnerId() == null) {
            throw new IllegalArgumentException("ownerId is required");
        }
        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new EntityNotFoundException("Owner not found: " + request.getOwnerId()));
                
        // Validate owner role
        if (!"HORSE_OWNER".equals(owner.getRole().name()) && !"ADMIN".equals(owner.getRole().name())) {
            throw new IllegalArgumentException("Owner must have role HORSE_OWNER or ADMIN");
        }

        // Validate gender
        HorseGender gender;
        try {
            gender = HorseGender.valueOf(request.getGender().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid gender. Must be STALLION, MARE, or GELDING");
        }

        // Auto-generate registration number if not provided
        String regNumber = request.getRegistrationNumber();
        if (regNumber == null || regNumber.isBlank()) {
            regNumber = "EQX-" + System.currentTimeMillis();
        }

        Horse horse = Horse.builder()
                .owner(owner)
                .horseName(request.getHorseName())
                .nickname(request.getNickname())
                .registrationNumber(regNumber)
                .gender(gender)
                .breed(request.getBreed())
                .age(request.getAge())
                .color(request.getColor())
                .countryOfOrigin(request.getCountryOfOrigin())
                .heightCm(request.getHeightCm())
                .weightKg(request.getWeightKg())
                .speed(request.getSpeed())
                .stamina(request.getStamina())
                .acceleration(request.getAcceleration())
                .agility(request.getAgility())
                .paceStyle(request.getPaceStyle())
                .healthStatus(request.getHealthStatus() != null ? request.getHealthStatus() : "HEALTHY")
                .injuryNotes(request.getInjuryNotes())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .build();

        return mapToResponse(repo.save(horse));
    }

    @Override
    public HorseResponse update(@NonNull Long id, @NonNull HorseUpdateRequest request) {
        Horse h = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Horse not found: " + id));

        // Validate gender
        HorseGender gender;
        try {
            gender = HorseGender.valueOf(request.getGender().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid gender. Must be STALLION, MARE, or GELDING");
        }

        h.setHorseName(request.getHorseName());
        h.setNickname(request.getNickname());
        h.setGender(gender);
        h.setBreed(request.getBreed());
        h.setAge(request.getAge());
        h.setColor(request.getColor());
        h.setCountryOfOrigin(request.getCountryOfOrigin());
        h.setHeightCm(request.getHeightCm());
        h.setWeightKg(request.getWeightKg());
        h.setSpeed(request.getSpeed());
        h.setStamina(request.getStamina());
        h.setAcceleration(request.getAcceleration());
        h.setAgility(request.getAgility());
        h.setPaceStyle(request.getPaceStyle());
        h.setHealthStatus(request.getHealthStatus());
        h.setInjuryNotes(request.getInjuryNotes());
        h.setImageUrl(request.getImageUrl());
        h.setDescription(request.getDescription());

        return mapToResponse(repo.save(h));
    }

    @Override
    public void delete(@NonNull Long id) {
        repo.deleteById(id);
    }
}


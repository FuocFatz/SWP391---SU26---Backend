package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.PairingContractRepository;
import com.equix.horseracingsystem.repository.RaceRegistrationRepository;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.entity.AuditLog;
import com.equix.horseracingsystem.controller.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class HorseServiceImpl implements HorseService {

    private static final Set<String> VALID_GENDERS = Set.of("STALLION", "MARE", "GELDING");
    private static final Set<String> OWNER_STATUSES = Set.of("AVAILABLE", "TRAINING", "UNAVAILABLE");
    private static final Set<String> PACE_STYLES = Set.of("FRONT", "PACE", "LATE", "END");

    private final HorseRepository repo;
    private final PairingContractRepository pairingRepository;
    private final RaceRegistrationRepository registrationRepository;
    private final AuditLogRepository auditLogRepository;

    public HorseServiceImpl(HorseRepository repo, PairingContractRepository pairingRepository,
                            RaceRegistrationRepository registrationRepository,
                            AuditLogRepository auditLogRepository) {
        this.repo = repo;
        this.pairingRepository = pairingRepository;
        this.registrationRepository = registrationRepository;
        this.auditLogRepository = auditLogRepository;
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
        validateCoreFields(horse);
        if (horse.getRegistrationNumber() == null || horse.getRegistrationNumber().isBlank()) {
            horse.setRegistrationNumber("EQX-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        }
        horse.setGender(normalizeGender(horse.getGender()));
        horse.setStatus("AVAILABLE");
        horse.setImageUrl(null);
        horse.setPaceStyle(normalizePaceStyle(horse.getPaceStyle()));
        return repo.save(horse);
    }

    @Override
    public Horse update(@NonNull Long id, Horse horse) {
        Horse h = getById(id);
        validateCoreFields(horse);
        String beforeStatus = normalizeStatus(h.getStatus());

        h.setHorseName(horse.getHorseName());
        h.setNickname(horse.getNickname());
        h.setRegistrationNumber(horse.getRegistrationNumber());
        h.setGender(normalizeGender(horse.getGender()));
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
        h.setPaceStyle(normalizePaceStyle(horse.getPaceStyle()));
        h.setHealthStatus(horse.getHealthStatus());
        h.setInjuryNotes(horse.getInjuryNotes());
        if (horse.getStatus() != null && !horse.getStatus().equals(h.getStatus())) {
            String nextStatus = normalizeStatus(horse.getStatus());
            if (Set.of("PAIRED", "REGISTERED").contains(beforeStatus)) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "A paired or registered horse must change status through the race workflow");
            }
            if (!OWNER_STATUSES.contains(nextStatus)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Owner-managed horse status must be AVAILABLE, TRAINING, or UNAVAILABLE");
            }
            if ("UNAVAILABLE".equals(beforeStatus) && "AVAILABLE".equals(nextStatus)
                    && !Boolean.TRUE.equals(horse.getFitConfirmation())) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Confirm that the horse is fit and ready to race");
            }
            h.setStatus(nextStatus);
        }
        h.setDescription(horse.getDescription());
        Horse saved = repo.save(h);
        if (!beforeStatus.equals(normalizeStatus(saved.getStatus()))) {
            auditLogRepository.save(AuditLog.builder().userId(saved.getOwnerId()).userRole("HORSE_OWNER")
                    .action("HORSE_STATUS_CHANGE").entityType("HORSE").entityId(saved.getId())
                    .beforeValue(beforeStatus).afterValue(saved.getStatus()).build());
        }
        return saved;
    }

    @Override
    public Horse updatePortrait(@NonNull Long id, String imageUrl) {
        Horse horse = getById(id);
        horse.setImageUrl(imageUrl);
        return repo.save(horse);
    }

    @Override
    public void delete(@NonNull Long id) {
        Horse horse = getById(id);
        if (pairingRepository.existsByHorseIdAndStatus(id, "ACTIVE")) {
            throw new ApiException(HttpStatus.CONFLICT, "Dissolve the active pairing before deleting this horse");
        }
        boolean activeRegistration = registrationRepository.findByHorseId(id).stream()
                .anyMatch(entry -> entry.getDeletedAt() == null
                        && !Set.of("WITHDRAWN", "CANCELLED", "REJECTED_BY_REFEREE").contains(normalizeStatus(entry.getStatus())));
        if (activeRegistration) {
            throw new ApiException(HttpStatus.CONFLICT, "Withdraw active race registrations before deleting this horse");
        }
        horse.setDeletedAt(LocalDateTime.now());
        repo.save(horse);
    }

    private void validateCoreFields(Horse horse) {
        if (horse.getHorseName() == null || horse.getHorseName().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Horse name is required");
        }
        if (horse.getAge() != null && horse.getAge() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Horse age must be positive");
        }
        for (Integer attribute : List.of(value(horse.getSpeed()), value(horse.getStamina()),
                value(horse.getAcceleration()), value(horse.getAgility()))) {
            if (attribute != 0 && (attribute < 1 || attribute > 100)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Horse training attributes must be between 1 and 100");
            }
        }
    }

    private String normalizePaceStyle(String paceStyle) {
        if (paceStyle == null || paceStyle.isBlank()) return "PACE";
        String normalized = paceStyle.trim().toUpperCase(Locale.ROOT);
        if (!PACE_STYLES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Training position must be FRONT, PACE, LATE, or END");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }

    private int value(Integer number) { return number == null ? 0 : number; }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank() || "UNKNOWN".equalsIgnoreCase(gender)) {
            return "STALLION";
        }
        String normalized = gender.trim().toUpperCase(Locale.ROOT);
        if (!VALID_GENDERS.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Horse gender must be STALLION, MARE, or GELDING");
        }
        return normalized;
    }
}

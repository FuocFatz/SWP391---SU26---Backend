package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.HorseRequest;
import com.equix.horseracingsystem.dto.HorseResponse;
import com.equix.horseracingsystem.entity.Horse;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.HorseStatus;
import com.equix.horseracingsystem.constant.HorseHealthStatus;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.HorseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HorseServiceImpl implements HorseService {

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ApiResponseWrapper<HorseResponse> createHorse(HorseRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Chủ sở hữu không tồn tại"));

        Horse horse = new Horse();
        horse.setOwner(owner);
        mapRequestToEntity(request, horse);

        // Gán các giá trị mặc định hệ thống đua
        if (horse.getSpeed() == null) horse.setSpeed(0);
        if (horse.getStamina() == null) horse.setStamina(0);
        if (horse.getAcceleration() == null) horse.setAcceleration(0);
        if (horse.getAgility() == null) horse.setAgility(0);

        horse.setTotalRaces(0);
        horse.setTotalWins(0);
        horse.setTotalTop3(0);
        horse.setTotalPoints(0);
        horse.setCreatedAt(LocalDateTime.now());
        horse.setUpdatedAt(LocalDateTime.now());

        Horse saved = horseRepository.save(horse);
        return ApiResponseWrapper.success("Đăng ký ngựa đua thành công!", mapToResponse(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<List<HorseResponse>> getMyHorses(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));

        List<Horse> horses = horseRepository.findByOwnerId(owner.getId());
        List<HorseResponse> responseList = horses.stream()
                .filter(h -> h.getDeletedAt() == null)
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ApiResponseWrapper.success("Lấy danh sách ngựa thành công!", responseList);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<HorseResponse> getHorseById(Long id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngựa đua yêu cầu"));

        if (horse.getDeletedAt() != null) {
            return ApiResponseWrapper.error("Ngựa đua này đã bị xóa.");
        }
        return ApiResponseWrapper.success("Lấy thông tin chi tiết thành công!", mapToResponse(horse));
    }

    @Override
    @Transactional
    public ApiResponseWrapper<HorseResponse> updateHorse(Long id, HorseRequest request, String currentUserEmail) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngựa đua yêu cầu"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (currentUser.getRole() != UserRole.ADMIN && !horse.getOwner().getId().equals(currentUser.getId())) {
            return ApiResponseWrapper.error("Từ chối truy cập: Bạn không sở hữu ngựa đua này.");
        }

        mapRequestToEntity(request, horse);
        horse.setUpdatedAt(LocalDateTime.now());

        Horse updated = horseRepository.save(horse);
        return ApiResponseWrapper.success("Cập nhật thông tin thành công!", mapToResponse(updated));
    }

    private void mapRequestToEntity(HorseRequest request, Horse horse) {
        if (request.getHorseName() != null) horse.setHorseName(request.getHorseName());
        if (request.getNickname() != null) horse.setNickname(request.getNickname());
        if (request.getRegistrationNumber() != null) horse.setRegistrationNumber(request.getRegistrationNumber());
        if (request.getGender() != null) horse.setGender(request.getGender());
        if (request.getBreed() != null) horse.setBreed(request.getBreed());
        if (request.getAge() != null) horse.setAge(request.getAge());
        if (request.getColor() != null) horse.setColor(request.getColor());
        if (request.getCountryOfOrigin() != null) horse.setCountryOfOrigin(request.getCountryOfOrigin());
        if (request.getHeightCm() != null) horse.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) horse.setWeightKg(request.getWeightKg());
        if (request.getSpeed() != null) horse.setSpeed(request.getSpeed());
        if (request.getStamina() != null) horse.setStamina(request.getStamina());
        if (request.getAcceleration() != null) horse.setAcceleration(request.getAcceleration());
        if (request.getAgility() != null) horse.setAgility(request.getAgility());
        if (request.getPaceStyle() != null) horse.setPaceStyle(request.getPaceStyle());
        if (request.getInjuryNotes() != null) horse.setInjuryNotes(request.getInjuryNotes());
        if (request.getImageUrl() != null) horse.setImageUrl(request.getImageUrl());
        if (request.getDescription() != null) horse.setDescription(request.getDescription());

        if (request.getHealthStatus() != null) {
            try {
                horse.setHealthStatus(HorseHealthStatus.valueOf(request.getHealthStatus().toUpperCase()));
            } catch (Exception e) {
                horse.setHealthStatus(HorseHealthStatus.HEALTHY);
            }
        }
        if (request.getStatus() != null) {
            try {
                horse.setStatus(HorseStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (Exception e) {
                horse.setStatus(HorseStatus.AVAILABLE);
            }
        }
    }

    private HorseResponse mapToResponse(Horse horse) {
        return HorseResponse.builder()
                .id(horse.getId())
                .ownerId(horse.getOwner().getId())
                .ownerName(horse.getOwner().getFullName())
                .horseName(horse.getHorseName())
                .nickname(horse.getNickname())
                .registrationNumber(horse.getRegistrationNumber())
                .gender(horse.getGender())
                .breed(horse.getBreed())
                .age(horse.getAge())
                .color(horse.getColor())
                .countryOfOrigin(horse.getCountryOfOrigin())
                .heightCm(horse.getHeightCm())
                .weightKg(horse.getWeightKg())
                .speed(horse.getSpeed())
                .stamina(horse.getStamina())
                .acceleration(horse.getAcceleration())
                .agility(horse.getAgility())
                .paceStyle(horse.getPaceStyle())
                .healthStatus(horse.getHealthStatus().name())
                .injuryNotes(horse.getInjuryNotes())
                .status(horse.getStatus().name())
                .totalRaces(horse.getTotalRaces())
                .totalWins(horse.getTotalWins())
                .totalTop3(horse.getTotalTop3())
                .totalPoints(horse.getTotalPoints())
                .imageUrl(horse.getImageUrl())
                .description(horse.getDescription())
                .createdAt(horse.getCreatedAt())
                .build();
    }
}
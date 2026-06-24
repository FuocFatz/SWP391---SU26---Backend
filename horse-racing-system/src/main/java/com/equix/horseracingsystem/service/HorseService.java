package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.HorseRequest;
import com.equix.horseracingsystem.dto.HorseResponse;

import java.util.List;

public interface HorseService {
    ApiResponseWrapper<HorseResponse> createHorse(HorseRequest request, String ownerEmail);
    ApiResponseWrapper<List<HorseResponse>> getMyHorses(String ownerEmail);
    ApiResponseWrapper<HorseResponse> getHorseById(Long id);
    ApiResponseWrapper<HorseResponse> updateHorse(Long id, HorseRequest request, String currentUserEmail);
}
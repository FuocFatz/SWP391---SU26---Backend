package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.dto.HorseCreateRequest;
import com.equix.horseracingsystem.dto.HorseResponse;
import org.springframework.lang.NonNull;

import java.util.List;

public interface HorseService {

    List<HorseResponse> getAll();

    List<HorseResponse> getByOwner(@NonNull Long ownerId);

    HorseResponse getById(@NonNull Long id);

    HorseResponse create(@NonNull HorseCreateRequest request);

    HorseResponse update(@NonNull Long id, @NonNull com.equix.horseracingsystem.dto.HorseUpdateRequest request);

    void delete(@NonNull Long id);
}

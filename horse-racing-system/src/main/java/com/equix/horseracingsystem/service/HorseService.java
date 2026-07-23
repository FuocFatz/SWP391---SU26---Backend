package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.entity.Horse;
import org.springframework.lang.NonNull;

import java.util.List;

public interface HorseService {

    List<Horse> getAll();

    List<Horse> getByOwner(@NonNull Long ownerId);

    Horse getById(@NonNull Long id);

    Horse create(@NonNull Horse horse);

    Horse update(@NonNull Long id, Horse horse);

    Horse updatePortrait(@NonNull Long id, String imageUrl);

    void delete(@NonNull Long id);
}

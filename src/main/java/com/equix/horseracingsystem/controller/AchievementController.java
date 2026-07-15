package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Achievement;
import com.equix.horseracingsystem.repository.AchievementRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/achievements")
@CrossOrigin("*")
@Tag(name = "Achievements")
@SuppressWarnings("null")
public class AchievementController {
    private final AchievementRepository repository;

    public AchievementController(AchievementRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Achievement> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Achievement create(@RequestBody Achievement achievement) {
        return repository.save(achievement);
    }
}

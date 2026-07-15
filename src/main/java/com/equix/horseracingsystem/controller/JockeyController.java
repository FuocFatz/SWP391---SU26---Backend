package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.JockeyProfile;
import com.equix.horseracingsystem.entity.JockeyAchievement;
import com.equix.horseracingsystem.repository.JockeyProfileRepository;
import com.equix.horseracingsystem.repository.JockeyAchievementRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.repository.AchievementRepository;
import com.equix.horseracingsystem.util.SecurityUtil;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/jockeys")
@CrossOrigin("*")
@Tag(name = "Jockeys")
@SuppressWarnings("null")
public class JockeyController {
    private final JockeyProfileRepository repository;
    private final JockeyAchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final AchievementRepository achRepo;
    private final SecurityUtil securityUtil;

    public JockeyController(JockeyProfileRepository repository, JockeyAchievementRepository achievementRepository, UserRepository userRepository, AchievementRepository achRepo, SecurityUtil securityUtil) {
        this.repository = repository;
        this.achievementRepository = achievementRepository;
        this.userRepository = userRepository;
        this.achRepo = achRepo;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public List<JockeyProfile> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{jockeyId}")
    public JockeyProfile getById(@PathVariable Long jockeyId) {
        return repository.findById(jockeyId).orElseThrow(() -> new RuntimeException("Not found"));
    }

    @PutMapping("/my-profile")
    @PreAuthorize("hasRole('JOCKEY')")
    public JockeyProfile updateProfile(@RequestBody JockeyProfile profile) {
        Long currentUserId = securityUtil.getCurrentUserId();
        JockeyProfile existing = repository.findByUserId(currentUserId).orElseThrow(() -> new RuntimeException("Not found"));
        existing.setAvailabilityStatus(profile.getAvailabilityStatus());
        return repository.save(existing);
    }

    @PostMapping("/{jockeyId}/achievements")
    public JockeyAchievement addAchievement(@PathVariable Long jockeyId, @RequestBody JockeyAchievement request) {
        request.setJockey(userRepository.findById(jockeyId).orElseThrow());
        request.setAchievement(achRepo.findById(request.getAchievement().getId()).orElseThrow());
        return achievementRepository.save(request);
    }
}

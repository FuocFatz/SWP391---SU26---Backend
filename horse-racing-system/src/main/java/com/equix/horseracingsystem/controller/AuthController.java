package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(
            UserRepository userRepository,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists";
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());

        user.setEnabled(true);
        user.setRewardPoints(0);

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        return "Register Success";
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        if (!request.getPassword().equals(user.getPassword())) {
            throw new RuntimeException("Wrong Password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token);
    }
}
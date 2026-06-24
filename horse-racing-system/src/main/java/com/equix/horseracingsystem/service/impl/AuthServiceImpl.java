package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.ApiResponseWrapper;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.UserStatus;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public ApiResponseWrapper<AuthResponse> register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ApiResponseWrapper.error("Email already exists");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ApiResponseWrapper.error("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());

        // 1. Chuẩn hóa và gán gía trị dựa theo cấu trúc Enum mới
        user.setRole(normalizeRole(request.getRole()));
        user.setStatus(UserStatus.PENDING);

        user.setRewardPoints(0);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());

        AuthResponse authResponse = toAuthResponse(token, saved);
        return ApiResponseWrapper.success("User registered successfully. Status is PENDING. Please wait for Admin approval.", authResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponseWrapper<AuthResponse> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        // 2. Chuyển đổi so sánh từ chuỗi String sang kiểm tra Enum trực tiếp
        if (user.getStatus() != UserStatus.VERIFIED) {
            return ApiResponseWrapper.error("Access Denied: Your account status is " + user.getStatus() + ". Please wait for administrator verification.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ApiResponseWrapper.error("Wrong Password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        AuthResponse authResponse = toAuthResponse(token, user);
        return ApiResponseWrapper.success("Login successful", authResponse);
    }

    // 3. Cập nhật kiểu trả về của hàm bổ trợ từ String thành UserRole Enum
    private UserRole normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.HORSE_OWNER;
        }

        String upperRole = role.toUpperCase().trim();
        if ("OWNER".equals(upperRole)) {
            return UserRole.HORSE_OWNER;
        }

        try {
            return UserRole.valueOf(upperRole);
        } catch (IllegalArgumentException e) {
            // Trả về role mặc định an toàn nếu Frontend truyền sai text không có trong Enum định nghĩa
            return UserRole.SPECTATOR;
        }
    }

    // 4. Đồng bộ hóa chuyển đổi Entity sang DTO dựa vào định dạng Enum
    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(), // Sử dụng .name() để biến Enum thành chuỗi String trả về JSON cho Client
                user.getRewardPoints()
        );
    }
}
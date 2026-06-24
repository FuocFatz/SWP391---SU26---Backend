package com.equix.horseracingsystem.service.impl;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.PasswordResetToken;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.UserStatus;
import com.equix.horseracingsystem.repository.PasswordResetTokenRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.AuthService;
import com.equix.horseracingsystem.service.EmailService; // 1. THÊM IMPORT NÀY
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService; // 2. BỔ SUNG EMAIL SERVICE VÀO ĐÂY (Lombok tự inject qua @RequiredArgsConstructor)

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
            return UserRole.SPECTATOR;
        }
    }

    @Override
    @Transactional
    public ApiResponseWrapper<String> forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim());

        if (userOpt.isEmpty()) {
            return ApiResponseWrapper.success("Nếu Email tồn tại trên hệ thống, mã khôi phục đã được gửi đi.", null);
        }

        User user = userOpt.get();

        tokenRepository.deleteByUserId(user.getId());

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = DigestUtils.md5DigestAsHex(rawToken.getBytes(StandardCharsets.UTF_8));

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetToken.setIsUsed(false);
        resetToken.setCreatedAt(LocalDateTime.now());

        tokenRepository.save(resetToken);

        // 3. SỬA TẠI ĐÂY: Gọi emailService thực tế để gửi đi thay vì chỉ in log
        emailService.sendResetPasswordEmail(user.getEmail(), rawToken);

        return ApiResponseWrapper.success("Yêu cầu thành công! Vui lòng kiểm tra hộp thư Email để lấy mã khôi phục.", rawToken);
    }

    @Override
    @Transactional
    public ApiResponseWrapper<String> resetPassword(ResetPasswordRequest request) {
        String inputHash = DigestUtils.md5DigestAsHex(request.getToken().trim().getBytes(StandardCharsets.UTF_8));

        PasswordResetToken resetToken = tokenRepository.findByTokenHashAndIsUsedFalse(inputHash)
                .orElseThrow(() -> new RuntimeException("Mã Token khôi phục không chính xác, không tồn tại hoặc đã được sử dụng trước đó."));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ApiResponseWrapper.error("Mã khôi phục đã hết hạn. Vui lòng gửi lại yêu cầu quên mật khẩu mới.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setIsUsed(true);
        tokenRepository.save(resetToken);

        return ApiResponseWrapper.success("Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.", null);
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getRewardPoints()
        );
    }
}
package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.repository.PasswordResetTokenRepository;
import com.equix.horseracingsystem.service.EmailService;
import com.equix.horseracingsystem.entity.PasswordResetToken;
import com.equix.horseracingsystem.dto.PasswordResetConfirmRequest;
import com.equix.horseracingsystem.dto.PasswordResetRequest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
@Tag(name = "Authentication", description = "User registration and login endpoints")
@SuppressWarnings("null")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    public AuthController(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Operation(summary = "Register a new user",
            description = "Creates a new user account and returns a JWT token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Email already exists or invalid input",
                    content = @Content)
    })
    @SecurityRequirements
    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        com.equix.horseracingsystem.enums.Role normalizedRole = normalizeRole(request.getRole());
        user.setRole(normalizedRole);

        if (normalizedRole == com.equix.horseracingsystem.enums.Role.SPECTATOR) {
            user.setStatus(com.equix.horseracingsystem.enums.UserStatus.VERIFIED);
        } else {
            user.setStatus(com.equix.horseracingsystem.enums.UserStatus.PENDING);
        }
        user.setRewardPoints(0);

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());

        return toAuthResponse(token, saved);
    }

    @Operation(summary = "User login",
            description = "Authenticates a user and returns a JWT token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid email or password",
                    content = @Content)
    })
    @SecurityRequirements
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Wrong Password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return toAuthResponse(token, user);
    }

    private com.equix.horseracingsystem.enums.Role normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return com.equix.horseracingsystem.enums.Role.HORSE_OWNER;
        }
        try {
            return com.equix.horseracingsystem.enums.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return com.equix.horseracingsystem.enums.Role.SPECTATOR;
        }
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getRewardPoints()
        );
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody PasswordResetRequest req) {
        String generic = "If an account with that email exists, a reset link has been sent.";
        if (req.getEmail() == null || req.getEmail().isBlank()) return generic;

        userRepository.findByEmail(req.getEmail()).ifPresent(user -> {
            String token = generateSecureToken();
            String hashed = passwordEncoder.encode(token);

            PasswordResetToken prt = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hashed)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .build();
            tokenRepository.save(prt);

            String resetLink = String.format("%s/reset-password?token=%s", "https://example.com", token);
            emailService.sendPasswordReset(user.getEmail(), resetLink);
        });
        return generic;
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody PasswordResetConfirmRequest req) {
        if (req.getToken() == null || req.getToken().isBlank()) throw new IllegalArgumentException("Invalid token");
        if (!isValidPassword(req.getNewPassword())) throw new IllegalArgumentException("Password does not meet policy");

        List<PasswordResetToken> candidates = tokenRepository.findByIsUsedFalseAndExpiresAtAfter(LocalDateTime.now());
        PasswordResetToken matched = null;
        User user = null;
        for (PasswordResetToken t : candidates) {
            if (passwordEncoder.matches(req.getToken(), t.getTokenHash())) {
                matched = t;
                user = t.getUser();
                break;
            }
        }
        if (matched == null || user == null) throw new IllegalArgumentException("Invalid or expired token");

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        matched.setIsUsed(true);
        tokenRepository.save(matched);

        emailService.sendPasswordChanged(user.getEmail());
        return "Password updated";
    }

    private boolean isValidPassword(String p) {
        if (p == null || p.length() < 8) return false;
        boolean hasLetter = false, hasDigit = false;
        for (char c : p.toCharArray()) {
            if (Character.isLetter(c)) hasLetter = true;
            if (Character.isDigit(c)) hasDigit = true;
        }
        return hasLetter && hasDigit;
    }

    private String generateSecureToken() {
        byte[] b = new byte[32];
        new SecureRandom().nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}

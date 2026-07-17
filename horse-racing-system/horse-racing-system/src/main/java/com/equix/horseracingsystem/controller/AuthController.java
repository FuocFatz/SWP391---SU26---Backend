package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.AuthResponse;
import com.equix.horseracingsystem.dto.LoginRequest;
import com.equix.horseracingsystem.dto.ProfileUpdateRequest;
import com.equix.horseracingsystem.dto.RegisterRequest;
import com.equix.horseracingsystem.dto.UserResponse;
import com.equix.horseracingsystem.entity.AuditLog;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@Tag(name = "Authentication", description = "User registration, login and current-session endpoints")
public class AuthController {

    private static final Set<String> PUBLIC_ROLES = Set.of("HORSE_OWNER", "JOCKEY", "SPECTATOR");

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          AuditLogRepository auditLogRepository,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary = "Register a public user account")
    @SecurityRequirements
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String role = normalizePublicRole(request.getRole());

        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email");
        }
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "This username is already in use");
        }

        String status = "SPECTATOR".equals(role) ? "VERIFIED" : "PENDING";
        User user = User.builder()
                .username(request.getUsername().trim())
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(blankToNull(request.getPhone()))
                .role(role)
                .status(status)
                .rewardPoints(0)
                .build();

        User saved = userRepository.save(user);
        audit(saved, "ACCOUNT_REGISTERED");

        String token = "VERIFIED".equals(status)
                ? jwtUtil.generateToken(saved.getEmail(), saved.getRole())
                : null;
        return toAuthResponse(token, saved);
    }

    @Operation(summary = "Authenticate with email and password")
    @SecurityRequirements
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            audit(user, "LOGIN_FAILED");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!isVerified(user)) {
            audit(user, "LOGIN_BLOCKED_" + user.getStatus().toUpperCase(Locale.ROOT));
            String message = "PENDING".equalsIgnoreCase(user.getStatus())
                    ? "Your account is pending Admin confirmation."
                    : "This account is not currently allowed to sign in.";
            throw new ApiException(HttpStatus.FORBIDDEN, message);
        }

        audit(user, "LOGIN_SUCCESS");
        return toAuthResponse(jwtUtil.generateToken(user.getEmail(), user.getRole()), user);
    }

    @Operation(summary = "Return the authenticated user")
    @GetMapping("/me")
    public UserResponse me(Principal principal) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        return UserResponse.from(user);
    }

    @Operation(summary = "Update safe fields on the authenticated profile")
    @PatchMapping("/me")
    public UserResponse updateMe(Principal principal, @Valid @RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        String before = user.getFullName() + " | " + nullSafe(user.getPhone());
        user.setFullName(request.getFullName().trim());
        user.setPhone(blankToNull(request.getPhone()));
        User saved = userRepository.save(user);
        auditProfile(saved, before, saved.getFullName() + " | " + nullSafe(saved.getPhone()));
        return UserResponse.from(saved);
    }

    private String normalizePublicRole(String requestedRole) {
        String normalized = requestedRole == null ? "" : requestedRole.trim().toUpperCase(Locale.ROOT);
        if ("OWNER".equals(normalized)) normalized = "HORSE_OWNER";
        if (!PUBLIC_ROLES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Public registration supports HORSE_OWNER, JOCKEY, or SPECTATOR only");
        }
        return normalized;
    }

    private boolean isVerified(User user) {
        return "VERIFIED".equalsIgnoreCase(user.getStatus())
                || "ACTIVE".equalsIgnoreCase(user.getStatus());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getFullName(),
                user.getEmail(), user.getRole(), user.getRewardPoints(), user.getStatus(),
                user.getPhone(), user.getAvatarUrl());
    }

    private void audit(User user, String action) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .userId(user == null ? null : user.getId())
                    .userRole(user == null ? null : user.getRole())
                    .action(action)
                    .entityType("AUTH")
                    .entityId(user == null ? null : user.getId())
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (RuntimeException ignored) {
            // Authentication must not fail solely because audit persistence is unavailable.
        }
    }

    private void auditProfile(User user, String before, String after) {
        auditLogRepository.save(AuditLog.builder()
                .userId(user.getId())
                .userRole(user.getRole())
                .action("PROFILE_UPDATED")
                .entityType("USER")
                .entityId(user.getId())
                .beforeValue(before)
                .afterValue(after)
                .timestamp(LocalDateTime.now())
                .build());
    }
}

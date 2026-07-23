package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.config.JwtUtil;
import com.equix.horseracingsystem.dto.*;
import com.equix.horseracingsystem.entity.AuditLog;
import com.equix.horseracingsystem.entity.EmailChangeToken;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.EmailChangeTokenRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.AvatarStorageService;
import com.equix.horseracingsystem.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@Tag(name = "Authentication", description = "User registration, login and current-session endpoints")
public class AuthController {

    private static final Set<String> PUBLIC_ROLES = Set.of("HORSE_OWNER", "JOCKEY", "SPECTATOR");
    private static final Set<String> QUICK_LOGIN_ROLES = Set.of(
            "ADMIN", "HORSE_OWNER", "JOCKEY", "REFEREE", "SPECTATOR");

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;
    private final EmailChangeTokenRepository emailChangeTokenRepository;
    private final EmailService emailService;
    private final String frontendBaseUrl;
    private final boolean quickLoginEnabled;

    public AuthController(UserRepository userRepository,
                          AuditLogRepository auditLogRepository,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder,
                          AvatarStorageService avatarStorageService,
                          EmailChangeTokenRepository emailChangeTokenRepository,
                          EmailService emailService,
                          @Value("${app.frontend-base-url}") String frontendBaseUrl,
                          @Value("${app.quick-login.enabled:false}") boolean quickLoginEnabled) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.avatarStorageService = avatarStorageService;
        this.emailChangeTokenRepository = emailChangeTokenRepository;
        this.emailService = emailService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
        this.quickLoginEnabled = quickLoginEnabled;
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
                .rewardPoints(User.INITIAL_REWARD_POINTS)
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

    @Operation(summary = "List active database accounts available for local quick login")
    @SecurityRequirements
    @GetMapping("/quick-login/accounts")
    public List<QuickLoginAccountResponse> quickLoginAccounts(@RequestParam String role) {
        requireQuickLoginEnabled();
        String normalizedRole = normalizeQuickLoginRole(role);
        return userRepository.findByRoleAndDeletedAtIsNull(normalizedRole).stream()
                .filter(this::isVerified)
                .sorted(Comparator.comparing(User::getFullName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(User::getEmail, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(QuickLoginAccountResponse::from)
                .toList();
    }

    @Operation(summary = "Create a local demo session for a selected active database account")
    @SecurityRequirements
    @PostMapping("/quick-login")
    public AuthResponse quickLogin(@Valid @RequestBody QuickLoginRequest request) {
        requireQuickLoginEnabled();
        User user = userRepository.findByIdAndDeletedAtIsNull(request.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Quick login account not found"));
        normalizeQuickLoginRole(user.getRole());
        if (!isVerified(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active for quick login");
        }
        audit(user, "QUICK_LOGIN_SUCCESS");
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

    @Operation(summary = "Change the authenticated user's password after verifying the current password")
    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(Principal principal, @Valid @RequestBody ChangePasswordRequest request) {
        User user = authenticatedUser(principal);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogRepository.save(AuditLog.builder().userId(user.getId()).userRole(user.getRole())
                .action("PASSWORD_CHANGED").entityType("USER").entityId(user.getId())
                .timestamp(LocalDateTime.now()).build());
    }

    @Operation(summary = "Request an email change; the current email remains active until verification")
    @PostMapping("/me/email-change")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Transactional
    public String requestEmailChange(Principal principal, @Valid @RequestBody EmailChangeRequest request) {
        User user = authenticatedUser(principal);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        String newEmail = normalizeEmail(request.getNewEmail());
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New email must be different from the current email");
        }
        userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(newEmail)
                .filter(other -> !Objects.equals(other.getId(), user.getId()))
                .ifPresent(other -> { throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email"); });

        emailChangeTokenRepository.findByUserIdAndUsedFalseAndExpiresAtAfter(user.getId(), LocalDateTime.now())
                .forEach(existing -> existing.setUsed(true));
        String token = generateSecureToken();
        emailChangeTokenRepository.save(EmailChangeToken.builder()
                .userId(user.getId())
                .newEmail(newEmail)
                .tokenHash(passwordEncoder.encode(token))
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());
        emailService.sendEmailChangeVerification(newEmail,
                frontendBaseUrl + "/verify-email-change?token=" + token);
        auditLogRepository.save(AuditLog.builder().userId(user.getId()).userRole(user.getRole())
                .action("EMAIL_CHANGE_REQUESTED").entityType("USER").entityId(user.getId())
                .beforeValue(user.getEmail()).afterValue(newEmail).timestamp(LocalDateTime.now()).build());
        return "Verification sent to the new email address. The request expires in 30 minutes.";
    }

    @Operation(summary = "Confirm a pending email change using the verification token")
    @SecurityRequirements
    @PostMapping("/email-change/confirm")
    @Transactional
    public String confirmEmailChange(@Valid @RequestBody EmailChangeConfirmRequest request) {
        List<EmailChangeToken> candidates = emailChangeTokenRepository
                .findByUsedFalseAndExpiresAtAfter(LocalDateTime.now());
        EmailChangeToken matched = candidates.stream()
                .filter(candidate -> passwordEncoder.matches(request.getToken(), candidate.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired email verification token"));
        User user = userRepository.findByIdAndDeletedAtIsNull(matched.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired email verification token"));
        userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(matched.getNewEmail())
                .filter(other -> !Objects.equals(other.getId(), user.getId()))
                .ifPresent(other -> { throw new ApiException(HttpStatus.CONFLICT, "That email address is no longer available"); });

        String oldEmail = user.getEmail();
        user.setEmail(matched.getNewEmail());
        if (user.getUsername() != null && user.getUsername().equalsIgnoreCase(oldEmail)) {
            user.setUsername(matched.getNewEmail());
        }
        userRepository.save(user);
        candidates.stream().filter(candidate -> Objects.equals(candidate.getUserId(), user.getId()))
                .forEach(candidate -> candidate.setUsed(true));
        auditLogRepository.save(AuditLog.builder().userId(user.getId()).userRole(user.getRole())
                .action("EMAIL_CHANGED").entityType("USER").entityId(user.getId())
                .beforeValue(oldEmail).afterValue(user.getEmail()).timestamp(LocalDateTime.now()).build());
        return "Email address verified and updated. Please sign in again with the new email.";
    }

    @Operation(summary = "Upload a JPG, PNG, or WebP avatar for the authenticated user")
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateAvatar(Principal principal, @RequestPart("file") MultipartFile file) {
        User user = authenticatedUser(principal);
        String previousAvatar = user.getAvatarUrl();
        String nextAvatar = avatarStorageService.store(user.getId(), file);
        User saved;
        try {
            user.setAvatarUrl(nextAvatar);
            saved = userRepository.save(user);
        } catch (RuntimeException exception) {
            avatarStorageService.deleteManaged(nextAvatar);
            throw exception;
        }
        avatarStorageService.deleteManaged(previousAvatar);
        auditAvatar(saved, previousAvatar, nextAvatar, "AVATAR_UPDATED");
        return UserResponse.from(saved);
    }

    @Operation(summary = "Remove the authenticated user's avatar")
    @DeleteMapping("/me/avatar")
    public UserResponse removeAvatar(Principal principal) {
        User user = authenticatedUser(principal);
        String previousAvatar = user.getAvatarUrl();
        user.setAvatarUrl(null);
        User saved = userRepository.save(user);
        avatarStorageService.deleteManaged(previousAvatar);
        auditAvatar(saved, previousAvatar, null, "AVATAR_REMOVED");
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

    private String normalizeQuickLoginRole(String requestedRole) {
        String normalized = requestedRole == null ? "" : requestedRole.trim().toUpperCase(Locale.ROOT);
        if ("OWNER".equals(normalized)) normalized = "HORSE_OWNER";
        if (!QUICK_LOGIN_ROLES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported quick login role");
        }
        return normalized;
    }

    private void requireQuickLoginEnabled() {
        if (!quickLoginEnabled) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Quick login is disabled");
        }
    }

    private User authenticatedUser(Principal principal) {
        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    private boolean isVerified(User user) {
        return "VERIFIED".equalsIgnoreCase(user.getStatus())
                || "ACTIVE".equalsIgnoreCase(user.getStatus());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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

    private void auditAvatar(User user, String before, String after, String action) {
        auditLogRepository.save(AuditLog.builder()
                .userId(user.getId())
                .userRole(user.getRole())
                .action(action)
                .entityType("USER_AVATAR")
                .entityId(user.getId())
                .beforeValue(before)
                .afterValue(after)
                .timestamp(LocalDateTime.now())
                .build());
    }
}

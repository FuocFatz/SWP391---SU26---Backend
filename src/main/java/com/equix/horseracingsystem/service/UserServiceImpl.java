package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.AccountStatusRequest;
import com.equix.horseracingsystem.dto.CreateRefereeRequest;
import com.equix.horseracingsystem.dto.RoleChangeRequest;
import com.equix.horseracingsystem.entity.AuditLog;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.AuditLogRepository;
import com.equix.horseracingsystem.repository.HorseRepository;
import com.equix.horseracingsystem.repository.PairingContractRepository;
import com.equix.horseracingsystem.repository.RaceRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    private static final Set<String> ACCOUNT_STATUSES = Set.of("PENDING", "VERIFIED", "REJECTED", "SUSPENDED");
    private static final Set<String> ASSIGNABLE_ROLES = Set.of("HORSE_OWNER", "JOCKEY", "REFEREE", "SPECTATOR");
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final PairingContractRepository pairingRepository;
    private final HorseRepository horseRepository;
    private final RaceRepository raceRepository;
    private final AuditLogRepository auditLogRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           NotificationService notificationService,
                           PairingContractRepository pairingRepository,
                           HorseRepository horseRepository,
                           RaceRepository raceRepository,
                           AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.pairingRepository = pairingRepository;
        this.horseRepository = horseRepository;
        this.raceRepository = raceRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public User createReferee(CreateRefereeRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email");
        }
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "This username is already in use");
        }
        return userRepository.save(User.builder()
                .username(request.getUsername().trim())
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role("REFEREE")
                .status("VERIFIED")
                .rewardPoints(User.INITIAL_REWARD_POINTS)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAll() {
        return userRepository.findAllByDeletedAtIsNull();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getByRole(String role) {
        return userRepository.findByRoleAndDeletedAtIsNull(role.toUpperCase(Locale.ROOT));
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    @Transactional
    public User updateStatus(Long id, AccountStatusRequest request) {
        User user = getById(id);
        String status = request.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!ACCOUNT_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported account status");
        }
        if ("REJECTED".equals(status)
                && (request.getReason() == null || request.getReason().trim().length() < 20)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A rejection reason of at least 20 characters is required");
        }
        user.setStatus(status);
        User saved = userRepository.save(user);
        String type = "VERIFIED".equals(status) ? "ACCOUNT_APPROVED" : "ACCOUNT_" + status;
        String message = "REJECTED".equals(status)
                ? "Your account was rejected: " + request.getReason().trim()
                : "Your account status is now " + status + ".";
        notificationService.createIfAbsent(saved.getId(), type, "Account status updated", message, "/profile");
        return saved;
    }

    @Override
    @Transactional
    public User updateRole(String adminEmail, Long id, RoleChangeRequest request) {
        User admin = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(adminEmail)
                .filter(user -> "ADMIN".equals(user.getRole()))
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Only an Admin can reassign roles"));
        User user = getById(id);
        if ("ADMIN".equals(user.getRole())) {
            throw new ApiException(HttpStatus.CONFLICT, "Admin roles cannot be reassigned from this workflow");
        }
        String nextRole = request.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ASSIGNABLE_ROLES.contains(nextRole)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role must be HORSE_OWNER, JOCKEY, REFEREE, or SPECTATOR");
        }
        if (nextRole.equals(user.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a different role");
        }
        if ("JOCKEY".equals(user.getRole()) && pairingRepository.existsByJockeyIdAndStatus(user.getId(), "ACTIVE")) {
            throw new ApiException(HttpStatus.CONFLICT, "Dissolve the jockey's active pairing before changing roles");
        }
        if ("HORSE_OWNER".equals(user.getRole()) && (!horseRepository.findByOwnerIdAndDeletedAtIsNull(user.getId()).isEmpty()
                || pairingRepository.existsByOwnerIdAndStatus(user.getId(), "ACTIVE"))) {
            throw new ApiException(HttpStatus.CONFLICT, "Transfer or remove the owner's horses and active pairings before changing roles");
        }
        if ("REFEREE".equals(user.getRole()) && raceRepository.findByRefereeId(user.getId()).stream()
                .anyMatch(race -> race.getDeletedAt() == null
                        && !Set.of("OFFICIAL", "CANCELLED").contains(String.valueOf(race.getStatus()).toUpperCase(Locale.ROOT)))) {
            throw new ApiException(HttpStatus.CONFLICT, "Reassign the referee's active races before changing roles");
        }

        String previousRole = user.getRole();
        user.setRole(nextRole);
        user.setStatus("VERIFIED");
        User saved = userRepository.save(user);
        notificationService.createIfAbsent(saved.getId(), "ROLE_CHANGED", "Account role updated",
                "Your EquiX role changed from " + previousRole + " to " + nextRole + ".", "/profile");
        auditLogRepository.save(AuditLog.builder().userId(admin.getId()).userRole(admin.getRole())
                .action("ROLE_CHANGED").entityType("USER").entityId(saved.getId())
                .beforeValue(previousRole).afterValue(nextRole + ": " + request.getReason().trim())
                .timestamp(LocalDateTime.now()).build());
        return saved;
    }

    @Override
    @Transactional
    public void softDelete(Long id) {
        User user = getById(id);
        user.setDeletedAt(LocalDateTime.now());
        user.setStatus("SUSPENDED");
        userRepository.save(user);
    }
}

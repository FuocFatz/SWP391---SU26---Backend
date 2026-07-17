package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.AccountStatusRequest;
import com.equix.horseracingsystem.dto.CreateRefereeRequest;
import com.equix.horseracingsystem.entity.User;
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
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
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
                .rewardPoints(0)
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
        if ("REJECTED".equals(status) && (request.getReason() == null || request.getReason().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A rejection reason is required");
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
    public void softDelete(Long id) {
        User user = getById(id);
        user.setDeletedAt(LocalDateTime.now());
        user.setStatus("SUSPENDED");
        userRepository.save(user);
    }
}

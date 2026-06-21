package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.PasswordResetConfirmRequest;
import com.equix.horseracingsystem.dto.PasswordResetRequest;
import com.equix.horseracingsystem.entity.PasswordResetToken;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.PasswordResetTokenRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.service.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/password-reset")
@CrossOrigin("*")
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PasswordResetController(UserRepository userRepository,
                                   PasswordResetTokenRepository tokenRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/request")
    public String requestReset(@RequestBody PasswordResetRequest req) {
        // Always return generic success message to avoid user enumeration
        String generic = "If an account with that email exists, a reset link has been sent.";

        if (req.getEmail() == null || req.getEmail().isBlank()) return generic;

        userRepository.findByEmail(req.getEmail()).ifPresent(user -> {
            // generate secure token
            String token = generateSecureToken();
            String hashed = passwordEncoder.encode(token);

            PasswordResetToken prt = PasswordResetToken.builder()
                    .userId(user.getId())
                    .tokenHash(hashed)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .build();
            tokenRepository.save(prt);

            // build reset link (frontend will have route to consume token)
            String resetLink = String.format("%s/reset-password?token=%s", "https://example.com", token);

            // send email (implementation may be logging during dev)
            emailService.sendPasswordReset(user.getEmail(), resetLink);
        });

        return generic;
    }

    @PostMapping("/confirm")
    public String confirmReset(@RequestBody PasswordResetConfirmRequest req) {
        if (req.getToken() == null || req.getToken().isBlank()) {
            throw new IllegalArgumentException("Invalid token");
        }
        if (!isValidPassword(req.getNewPassword())) {
            throw new IllegalArgumentException("Password does not meet policy");
        }

        // find candidate tokens not used and not expired
        List<PasswordResetToken> candidates = tokenRepository.findByUsedFalseAndExpiresAtAfter(LocalDateTime.now());

        PasswordResetToken matched = null;
        User user = null;
        for (PasswordResetToken t : candidates) {
            if (passwordEncoder.matches(req.getToken(), t.getTokenHash())) {
                matched = t;
                user = userRepository.findById(t.getUserId()).orElse(null);
                break;
            }
        }

        if (matched == null || user == null) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        // update password
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        matched.setUsed(true);
        tokenRepository.save(matched);

        // send confirmation email
        emailService.sendPasswordChanged(user.getEmail());

        return "Password updated";
    }

    private boolean isValidPassword(String p) {
        if (p == null) return false;
        if (p.length() < 8) return false;
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


package com.equix.horseracingsystem.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.equix.horseracingsystem.repository.UserRepository;
import com.equix.horseracingsystem.entity.User;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {

    private final UserRepository userRepository;

    public SecurityUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Retrieves the current user's ID from the SecurityContextHolder.
     * This acts as an abstraction for Phase 5 (Security integration).
     * Currently returns a placeholder or parses the principal name.
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            // Placeholder user ID for development before Phase 5 is fully implemented
            return 1L;
        }
        
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(1L); // Fallback to 1L if user not found (or throw exception)
    }
}

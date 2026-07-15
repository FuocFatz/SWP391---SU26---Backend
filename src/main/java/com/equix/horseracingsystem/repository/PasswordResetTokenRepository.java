package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    List<PasswordResetToken> findByIsUsedFalseAndExpiresAtAfter(LocalDateTime now);
    List<PasswordResetToken> findByUserIdAndIsUsedFalseAndExpiresAtAfter(Long userId, LocalDateTime now);
}

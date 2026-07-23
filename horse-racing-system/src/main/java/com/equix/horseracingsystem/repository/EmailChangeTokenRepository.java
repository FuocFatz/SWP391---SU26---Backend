package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {
    List<EmailChangeToken> findByUserIdAndUsedFalseAndExpiresAtAfter(Long userId, LocalDateTime now);
    List<EmailChangeToken> findByUsedFalseAndExpiresAtAfter(LocalDateTime now);
}

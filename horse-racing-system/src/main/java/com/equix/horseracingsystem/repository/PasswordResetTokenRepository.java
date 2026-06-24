package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    // Tìm kiếm Token dựa trên mã băm hash và cờ chưa sử dụng
    Optional<PasswordResetToken> findByTokenHashAndIsUsedFalse(String tokenHash);

    // Xóa tất cả token khôi phục cũ của một user cụ thể
    void deleteByUserId(Long userId);
}
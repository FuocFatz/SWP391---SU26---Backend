package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.constant.UserRole;
import com.equix.horseracingsystem.constant.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // Truy vấn động kết hợp phân trang cho Admin kiếm tìm lọc dữ liệu
    @Query("SELECT u FROM User u WHERE " +
            "(:role IS NULL OR u.role = :role) AND " +
            "(:status IS NULL OR u.status = :status)")
    Page<User> findByRoleAndStatus(@Param("role") UserRole role,
                                   @Param("status") UserStatus status,
                                   Pageable pageable);
}
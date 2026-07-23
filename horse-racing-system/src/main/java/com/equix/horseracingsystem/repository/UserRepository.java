package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findByRole(String role);

    List<User> findAllByDeletedAtIsNull();

    List<User> findByRoleAndDeletedAtIsNull(String role);

    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from User user where lower(user.email) = lower(:email) and user.deletedAt is null")
    Optional<User> findByEmailForUpdate(@Param("email") String email);
}

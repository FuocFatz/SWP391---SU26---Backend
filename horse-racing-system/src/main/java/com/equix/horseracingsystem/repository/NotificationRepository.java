package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndReadFalse(Long userId);

    boolean existsByUserIdAndTypeAndTitleAndDeepLink(Long userId, String type, String title, String deepLink);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Notification n
               set n.read = true, n.readAt = :readAt
             where n.userId = :userId
               and (n.read = false or n.read is null)
            """)
    int markAllUnreadAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
}

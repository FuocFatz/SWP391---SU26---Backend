package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import com.equix.horseracingsystem.dto.NotificationResponse;
import com.equix.horseracingsystem.entity.Notification;
import com.equix.horseracingsystem.entity.User;
import com.equix.horseracingsystem.repository.NotificationRepository;
import com.equix.horseracingsystem.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listFor(String email) {
        User user = currentUser(email);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        return notificationRepository.countByUserIdAndReadFalse(currentUser(email).getId());
    }

    @Transactional
    public NotificationResponse markOneRead(String email, Long notificationId) {
        User user = currentUser(email);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!Boolean.TRUE.equals(notification.getRead()) || notification.getReadAt() == null) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public int markAllRead(String email) {
        User user = currentUser(email);
        return notificationRepository.markAllUnreadAsRead(user.getId(), LocalDateTime.now());
    }

    @Transactional
    public Notification createIfAbsent(Long userId, String type, String title, String message, String deepLink) {
        String channel = "IN_APP";
        if (notificationRepository.existsByUserIdAndTypeAndTitleAndDeepLink(userId, type, title, deepLink)) {
            return null;
        }
        return notificationRepository.save(Notification.builder()
                .userId(userId)
                .type(type)
                .channel(channel)
                .title(title)
                .message(message)
                .deepLink(deepLink)
                .read(false)
                .build());
    }

    private User currentUser(String email) {
        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }
}

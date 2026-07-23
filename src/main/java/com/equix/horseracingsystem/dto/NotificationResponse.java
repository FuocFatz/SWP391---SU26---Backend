package com.equix.horseracingsystem.dto;

import com.equix.horseracingsystem.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String channel;
    private String priority;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private String targetUrl;

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(), notification.getType(), notification.getTitle(),
                notification.getMessage(), notification.getChannel(), null,
                Boolean.TRUE.equals(notification.getRead()), notification.getReadAt(),
                notification.getCreatedAt(), notification.getDeepLink());
    }
}

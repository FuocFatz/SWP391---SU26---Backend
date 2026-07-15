package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.entity.Notification;
import com.equix.horseracingsystem.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.equix.horseracingsystem.util.SecurityUtil;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin("*")
@Tag(name = "Notifications", description = "In-app notification management")
@SuppressWarnings("null")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SecurityUtil securityUtil;

    public NotificationController(NotificationRepository notificationRepository, SecurityUtil securityUtil) {
        this.notificationRepository = notificationRepository;
        this.securityUtil = securityUtil;
    }

    @Operation(summary = "Get notifications by user",
            description = "Retrieves all notifications for a user, ordered by most recent first")
    @ApiResponse(responseCode = "200", description = "List of notifications",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = Notification.class))))
    @GetMapping
    public List<Notification> getByUser() {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(securityUtil.getCurrentUserId());
    }

    @Operation(summary = "Mark notification as read",
            description = "Marks a specific notification as read")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notification marked as read",
                    content = @Content(schema = @Schema(implementation = Notification.class))),
            @ApiResponse(responseCode = "400", description = "Notification not found", content = @Content)
    })
    @PutMapping("/{id}/read")
    public Notification markAsRead(
            @Parameter(description = "Notification ID") @PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @PutMapping("/read-all")
    public void markAllAsRead() {
        Long userId = securityUtil.getCurrentUserId();
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).toList();
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}

package com.equix.horseracingsystem.controller;

import com.equix.horseracingsystem.dto.MarkAllReadResponse;
import com.equix.horseracingsystem.dto.NotificationResponse;
import com.equix.horseracingsystem.dto.UnreadCountResponse;
import com.equix.horseracingsystem.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Authenticated user's in-app notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(summary = "List notifications owned by the authenticated user")
    @GetMapping
    public List<NotificationResponse> getMine(Principal principal) {
        return notificationService.listFor(principal.getName());
    }

    @Operation(summary = "Return the authenticated user's unread count")
    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(Principal principal) {
        return new UnreadCountResponse(notificationService.unreadCount(principal.getName()));
    }

    @Operation(summary = "Mark one owned notification as read")
    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable Long id, Principal principal) {
        return notificationService.markOneRead(principal.getName(), id);
    }

    @Operation(summary = "Mark all unread notifications owned by the authenticated user as read")
    @PatchMapping("/read-all")
    public MarkAllReadResponse markAllAsRead(Principal principal) {
        return new MarkAllReadResponse(notificationService.markAllRead(principal.getName()));
    }
}

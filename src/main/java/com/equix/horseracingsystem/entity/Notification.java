package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "category", nullable = false)
    private String type; // e.g., GUESS_LOCKED, RACE_CANCELLED

    private String channel; // IN_APP, EMAIL, PUSH

    private String title;

    @Column(length = 2000)
    private String message;

    @Column(name = "deep_link")
    private String deepLink;

    @Column(name = "is_read")
    private Boolean read;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (read == null) read = false;
    }
}

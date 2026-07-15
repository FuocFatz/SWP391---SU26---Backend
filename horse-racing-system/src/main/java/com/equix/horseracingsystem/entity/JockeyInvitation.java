package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "jockey_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JockeyInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "race_id")
    private Long raceId;

    @Column(name = "horse_id")
    private Long horseId;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "jockey_id")
    private Long jockeyId;

    private String status;

    @Column(length = 1000)
    private String message;

    @Column(name = "response_note", length = 1000)
    private String responseNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}

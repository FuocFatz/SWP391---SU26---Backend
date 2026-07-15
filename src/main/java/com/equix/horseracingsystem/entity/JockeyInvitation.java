package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.InvitationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "jockey_invitations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JockeyInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id")
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InvitationStatus status;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "response_note", columnDefinition = "NVARCHAR(MAX)")
    private String responseNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = InvitationStatus.PENDING;
    }
}

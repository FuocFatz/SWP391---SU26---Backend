package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.RegistrationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "race_registrations")
@SQLDelete(sql = "UPDATE race_registrations SET deleted_at = GETDATE() WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RaceRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pairing_contract_id")
    private PairingContract pairingContract;

    @Column(name = "lane_number")
    private Integer laneNumber;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RegistrationStatus status;

    @Column(name = "owner_confirmed")
    private Boolean ownerConfirmed;

    @Column(name = "jockey_confirmed")
    private Boolean jockeyConfirmed;

    @Column(name = "referee_approved")
    private Boolean refereeApproved;

    @Column(name = "health_check_status", length = 50)
    private String healthCheckStatus;

    @Column(name = "referee_notes", columnDefinition = "NVARCHAR(MAX)")
    private String refereeNotes;

    @Column(name = "withdraw_reason", columnDefinition = "NVARCHAR(MAX)")
    private String withdrawReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = RegistrationStatus.PENDING_ADMIN;
        if (ownerConfirmed == null) ownerConfirmed = false;
        if (jockeyConfirmed == null) jockeyConfirmed = false;
        if (refereeApproved == null) refereeApproved = false;
        if (healthCheckStatus == null) healthCheckStatus = "PENDING";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "race_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "race_id")
    private Long raceId;

    @Column(name = "horse_id")
    private Long horseId;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "pairing_contract_id")
    private Long pairingContractId;

    @Column(name = "jockey_id")
    private Long jockeyId;

    @Column(name = "lane_number")
    private Integer laneNumber;

    private String status;

    @Column(name = "owner_confirmed")
    private Boolean ownerConfirmed;

    @Column(name = "jockey_confirmed")
    private Boolean jockeyConfirmed;

    @Column(name = "referee_approved")
    private Boolean refereeApproved;

    @Column(name = "health_check_status")
    private String healthCheckStatus;

    @Column(name = "referee_notes", length = 1000)
    private String refereeNotes;

    @Column(name = "disqualification_reason", length = 1000)
    private String disqualificationReason;

    @Column(name = "disqualification_category", length = 40)
    private String disqualificationCategory;

    @Column(name = "disqualification_severity", length = 20)
    private String disqualificationSeverity;

    @Column(name = "disqualified_by")
    private Long disqualifiedBy;

    @Column(name = "disqualified_at")
    private LocalDateTime disqualifiedAt;

    @Column(name = "dnf_reason", length = 1000)
    private String dnfReason;

    @Column(name = "dnf_by")
    private Long dnfBy;

    @Column(name = "dnf_at")
    private LocalDateTime dnfAt;

    @Column(name = "withdraw_reason", length = 1000)
    private String withdrawReason;

    @Column(name = "created_at")
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
        if (status == null) {
            status = "PENDING_ADMIN";
        }
        if (ownerConfirmed == null) {
            ownerConfirmed = false;
        }
        if (jockeyConfirmed == null) {
            jockeyConfirmed = false;
        }
        if (refereeApproved == null) {
            refereeApproved = false;
        }
        if (healthCheckStatus == null) {
            healthCheckStatus = "PENDING";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

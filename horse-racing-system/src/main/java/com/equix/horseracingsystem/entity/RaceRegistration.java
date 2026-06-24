package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "race_registrations")
public class RaceRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pairing_contract_id")
    private PairingContract pairingContract;

    @Column(name = "lane_number")
    private Integer laneNumber;

    @Size(max = 30)
    @Nationalized
    @ColumnDefault("'PENDING_ADMIN'")
    @Column(name = "status", length = 30)
    private String status;

    @ColumnDefault("0")
    @Column(name = "owner_confirmed")
    private Boolean ownerConfirmed;

    @ColumnDefault("0")
    @Column(name = "jockey_confirmed")
    private Boolean jockeyConfirmed;

    @ColumnDefault("0")
    @Column(name = "referee_approved")
    private Boolean refereeApproved;

    @Size(max = 50)
    @Nationalized
    @ColumnDefault("'PENDING'")
    @Column(name = "health_check_status", length = 50)
    private String healthCheckStatus;

    @Nationalized
    @Lob
    @Column(name = "referee_notes")
    private String refereeNotes;

    @Nationalized
    @Lob
    @Column(name = "withdraw_reason")
    private String withdrawReason;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("getdate()")
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;


}
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
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Size(max = 50)
    @Nationalized
    @Column(name = "user_role", length = 50)
    private String userRole;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "\"action\"", nullable = false, length = 100)
    private String action;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Nationalized
    @Lob
    @Column(name = "before_value")
    private String beforeValue;

    @Nationalized
    @Lob
    @Column(name = "after_value")
    private String afterValue;

    @Size(max = 45)
    @Nationalized
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Size(max = 255)
    @Nationalized
    @Column(name = "user_agent")
    private String userAgent;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;


}
package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Size(max = 20)
    @Nationalized
    @ColumnDefault("'IN_APP'")
    @Column(name = "channel", length = 20)
    private String channel;

    @Size(max = 150)
    @NotNull
    @Nationalized
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @NotNull
    @Nationalized
    @Lob
    @Column(name = "message", nullable = false)
    private String message;

    @Size(max = 500)
    @Nationalized
    @Column(name = "deep_link", length = 500)
    private String deepLink;

    @ColumnDefault("0")
    @Column(name = "is_read")
    private Boolean isRead;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;


}
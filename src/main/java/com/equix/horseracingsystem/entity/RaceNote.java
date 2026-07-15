package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.NoteCategory;
import com.equix.horseracingsystem.enums.Severity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "race_notes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RaceNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_id", nullable = false)
    private User referee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private RaceRegistration registration;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_category", nullable = false, length = 30)
    private NoteCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Severity severity;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "action_taken", length = 100)
    private String actionTaken;

    @Column(name = "race_time_seconds")
    private Integer raceTimeSeconds;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (severity == null) severity = Severity.INFO;
    }
}

package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.enums.HorseGender;
import com.equix.horseracingsystem.enums.HorseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;

@Entity
@Table(name = "horses")
@SQLDelete(sql = "UPDATE horses SET deleted_at = GETDATE() WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Horse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "horse_name", nullable = false, length = 100)
    private String horseName;

    @Column(length = 100)
    private String nickname;

    @Column(name = "registration_number", nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HorseGender gender;

    @Column(length = 50)
    private String breed;

    private Integer age;

    @Column(length = 50)
    private String color;

    @Column(name = "country_of_origin", length = 50)
    private String countryOfOrigin;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    private Integer speed;
    private Integer stamina;
    private Integer acceleration;
    private Integer agility;

    @Column(name = "pace_style", length = 50)
    private String paceStyle;

    @Column(name = "health_status", length = 50)
    private String healthStatus;

    @Column(name = "injury_notes", columnDefinition = "NVARCHAR(MAX)")
    private String injuryNotes;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private HorseStatus status;

    @Column(name = "total_races")
    private Integer totalRaces;

    @Column(name = "total_wins")
    private Integer totalWins;

    @Column(name = "total_top3")
    private Integer totalTop3;

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

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
        if (healthStatus == null) healthStatus = "HEALTHY";
        if (status == null) status = HorseStatus.AVAILABLE;
        if (totalRaces == null) totalRaces = 0;
        if (totalWins == null) totalWins = 0;
        if (totalTop3 == null) totalTop3 = 0;
        if (totalPoints == null) totalPoints = 0;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

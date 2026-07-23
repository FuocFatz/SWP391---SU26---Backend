package com.equix.horseracingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "horses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Horse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "horse_name")
    private String horseName;

    private String nickname;

    @Column(name = "registration_number")
    private String registrationNumber;

    private String gender;

    private String breed;

    private Integer age;

    private String color;

    @Column(name = "country_of_origin")
    private String countryOfOrigin;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    private Integer speed;

    private Integer stamina;

    private Integer acceleration;

    private Integer agility;

    @Column(name = "pace_style")
    private String paceStyle;

    @Column(name = "health_status")
    private String healthStatus;

    private String status;

    @Column(name = "injury_notes")
    private String injuryNotes;

    @Column(name = "total_races")
    private Integer totalRaces;

    @Column(name = "total_wins")
    private Integer totalWins;

    @Column(name = "total_top3")
    private Integer totalTop3;

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "image_url")
    private String imageUrl;

    @Transient
    private Boolean fitConfirmation;

    @Column(name = "description")
    private String description;

    @Column(name = "owner_id")
    private Long ownerId;

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
        if (gender == null || gender.isBlank()) {
            gender = "STALLION";
        }
        if (healthStatus == null) {
            healthStatus = "HEALTHY";
        }
        if (status == null) {
            status = "AVAILABLE";
        }
        if (totalRaces == null) {
            totalRaces = 0;
        }
        if (totalWins == null) {
            totalWins = 0;
        }
        if (totalTop3 == null) {
            totalTop3 = 0;
        }
        if (totalPoints == null) {
            totalPoints = 0;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

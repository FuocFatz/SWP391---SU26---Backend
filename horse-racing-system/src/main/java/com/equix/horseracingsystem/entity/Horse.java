package com.equix.horseracingsystem.entity;

import com.equix.horseracingsystem.constant.HorseHealthStatus;
import com.equix.horseracingsystem.constant.HorseStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "horses")
public class Horse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "horse_name", nullable = false, length = 100)
    private String horseName;

    @Size(max = 100)
    @Nationalized
    @Column(name = "nickname", length = 100)
    private String nickname;

    @Size(max = 50)
    @NotNull
    @Nationalized
    @Column(name = "registration_number", nullable = false, length = 50)
    private String registrationNumber;

    @Size(max = 20)
    @NotNull
    @Nationalized
    @Column(name = "gender", nullable = false, length = 20)
    private String gender;

    @Size(max = 50)
    @Nationalized
    @Column(name = "breed", length = 50)
    private String breed;

    @Column(name = "age")
    private Integer age;

    @Size(max = 50)
    @Nationalized
    @Column(name = "color", length = 50)
    private String color;

    @Size(max = 50)
    @Nationalized
    @Column(name = "country_of_origin", length = 50)
    private String countryOfOrigin;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @ColumnDefault("0")
    @Column(name = "speed")
    private Integer speed;

    @ColumnDefault("0")
    @Column(name = "stamina")
    private Integer stamina;

    @ColumnDefault("0")
    @Column(name = "acceleration")
    private Integer acceleration;

    @ColumnDefault("0")
    @Column(name = "agility")
    private Integer agility;

    @Size(max = 50)
    @Nationalized
    @Column(name = "pace_style", length = 50)
    private String paceStyle;

    @Enumerated(EnumType.STRING)
    @Column(name = "health_status", length = 50)
    private HorseHealthStatus healthStatus = HorseHealthStatus.HEALTHY;

    @Nationalized
    @Lob
    @Column(name = "injury_notes")
    private String injuryNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private HorseStatus status = HorseStatus.AVAILABLE;

    @ColumnDefault("0")
    @Column(name = "total_races")
    private Integer totalRaces;

    @ColumnDefault("0")
    @Column(name = "total_wins")
    private Integer totalWins;

    @ColumnDefault("0")
    @Column(name = "total_top3")
    private Integer totalTop3;

    @ColumnDefault("0")
    @Column(name = "total_points")
    private Integer totalPoints;

    @Size(max = 500)
    @Nationalized
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Nationalized
    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
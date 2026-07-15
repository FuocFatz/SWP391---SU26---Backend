package com.equix.horseracingsystem.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorseResponse {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private String horseName;
    private String nickname;
    private String registrationNumber;
    private String gender;
    private String breed;
    private Integer age;
    private String color;
    private String countryOfOrigin;
    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private Integer speed;
    private Integer stamina;
    private Integer acceleration;
    private Integer agility;
    private String paceStyle;
    private String healthStatus;
    private String injuryNotes;
    private String status;
    private Integer totalRaces;
    private Integer totalWins;
    private Integer totalTop3;
    private Integer totalPoints;
    private String imageUrl;
    private String description;
    private LocalDateTime createdAt;
}
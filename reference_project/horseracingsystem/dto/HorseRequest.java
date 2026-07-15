package com.equix.horseracingsystem.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class HorseRequest {
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
    private String imageUrl;
    private String description;
}
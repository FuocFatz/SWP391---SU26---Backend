package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
@Schema(description = "Request to update an existing horse")
public class HorseUpdateRequest {

    @Schema(description = "Horse name", example = "Thunder Bolt", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Horse name is required")
    private String horseName;

    @Schema(description = "Nickname", example = "Bolt")
    private String nickname;

    @Schema(description = "Gender: STALLION, MARE, or GELDING", example = "STALLION", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Gender is required")
    private String gender;

    @Schema(description = "Breed", example = "Thoroughbred")
    private String breed;

    @Schema(description = "Age in years", example = "4")
    @Positive(message = "Age must be positive")
    private Integer age;

    @Schema(description = "Color", example = "Bay")
    private String color;

    @Schema(description = "Country of origin", example = "Vietnam")
    private String countryOfOrigin;

    @Schema(description = "Height in cm", example = "160.0")
    @Positive(message = "Height must be positive")
    private Double heightCm;

    @Schema(description = "Weight in kg", example = "450.0")
    @Positive(message = "Weight must be positive")
    private Double weightKg;

    @Schema(description = "Speed stat 0-100", example = "80")
    @Positive(message = "Speed must be positive")
    private Integer speed;

    @Schema(description = "Stamina stat 0-100", example = "75")
    @Positive(message = "Stamina must be positive")
    private Integer stamina;

    @Schema(description = "Acceleration stat 0-100", example = "70")
    @Positive(message = "Acceleration must be positive")
    private Integer acceleration;

    @Schema(description = "Agility stat 0-100", example = "65")
    @Positive(message = "Agility must be positive")
    private Integer agility;

    @Schema(description = "Pace style", example = "Front Runner")
    private String paceStyle;

    @Schema(description = "Health status", example = "HEALTHY")
    private String healthStatus;

    @Schema(description = "Injury notes")
    private String injuryNotes;

    @Schema(description = "Image URL")
    private String imageUrl;

    @Schema(description = "Description")
    private String description;
}

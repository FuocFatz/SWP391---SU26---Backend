package com.equix.horseracingsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Horse response payload")
public class HorseResponse {

    @Schema(description = "Horse ID", example = "1")
    private Long id;

    @Schema(description = "Horse name", example = "Thunder Bolt")
    private String horseName;

    @Schema(description = "Registration number", example = "EQX-1234567890")
    private String registrationNumber;

    @Schema(description = "Gender", example = "STALLION")
    private String gender;

    @Schema(description = "Breed", example = "Arabian")
    private String breed;

    @Schema(description = "Health Status", example = "HEALTHY")
    private String healthStatus;

    @Schema(description = "Owner user ID", example = "2")
    private Long ownerId;

    @Schema(description = "Owner name", example = "John Doe")
    private String ownerName;

    @Schema(description = "Status", example = "AVAILABLE")
    private String status;

    @Schema(description = "Speed", example = "85")
    private Integer speed;

    @Schema(description = "Stamina", example = "80")
    private Integer stamina;

    @Schema(description = "Total wins", example = "5")
    private Integer totalWins;

    @Schema(description = "Total races", example = "10")
    private Integer totalRaces;
}

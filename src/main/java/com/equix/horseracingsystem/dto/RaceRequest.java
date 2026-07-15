package com.equix.horseracingsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class RaceRequest {
    @NotNull(message = "Tournament ID is required")
    private Long tournamentId;

    @NotBlank(message = "Race name is required")
    private String raceName;

    @NotBlank(message = "Race type is required")
    private String raceType;

    @NotNull(message = "Race distance is required")
    @Positive
    private Integer raceDistance;

    private String trackCondition;

    @NotNull(message = "Race date is required")
    private LocalDate raceDate;

    @NotNull(message = "Race time is required")
    private LocalTime raceTime;

    @NotNull(message = "Registration deadline is required")
    private LocalDateTime registrationDeadline;

    private Integer totalLanes;
    private BigDecimal prizePoints;
    private String weather;
    private String location;
    private Long refereeId;
}

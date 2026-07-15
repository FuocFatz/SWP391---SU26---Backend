package com.equix.horseracingsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RaceResponse {
    private Long id;
    private Long tournamentId;
    private String name;
    private String type;
    private Integer distanceM;
    private String surface;
    private LocalDate raceDate;
    private LocalTime raceTime;
    private LocalDateTime registrationDeadline;
    private Integer maxParticipants;
    private BigDecimal prizePool;
    private String weather;
    private String location;
    private String status;
    private Long refereeId;
}

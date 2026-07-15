package com.equix.horseracingsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentRequest {
    private String name;
    private String description;
    private String location;
    private Integer gracePeriodHours;
    private LocalDate startDate;
    private LocalDate endDate;
}

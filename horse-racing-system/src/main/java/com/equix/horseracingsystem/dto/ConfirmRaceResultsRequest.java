package com.equix.horseracingsystem.dto;

import lombok.Data;

import java.util.List;

@Data
public class ConfirmRaceResultsRequest {
    private List<RaceResultRequest> results;
}

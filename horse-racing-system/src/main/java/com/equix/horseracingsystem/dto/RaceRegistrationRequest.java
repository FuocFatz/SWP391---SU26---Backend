package com.equix.horseracingsystem.dto;

import lombok.Data;

@Data
public class RaceRegistrationRequest {
    private Long horseId;
    private Long ownerId;
}

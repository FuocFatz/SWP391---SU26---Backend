package com.equix.horseracingsystem.dto;

import lombok.Data;

@Data
public class InvitationRequest {
    private Long raceId;
    private Long horseId;
    private Long ownerId;
    private Long jockeyId;
    private String message;
}

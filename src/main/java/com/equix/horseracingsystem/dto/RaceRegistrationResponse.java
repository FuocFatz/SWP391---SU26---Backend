package com.equix.horseracingsystem.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class RaceRegistrationResponse {
    private Long id;
    private Long raceId;
    private Long horseId;
    private Long jockeyId;
    private Long ownerId;
    private String status;
    private Boolean ownerConfirmed;
    private Boolean jockeyConfirmed;
    private Boolean refereeApproved;
    private String healthCheckStatus;
    private String refereeNotes;
    private String withdrawReason;
}

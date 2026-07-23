package com.equix.horseracingsystem.dto;

import com.equix.horseracingsystem.entity.RaceRegistration;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RaceEntryResponse {
    private Long id;
    private Long raceId;
    private Long horseId;
    private String horseName;
    private String horseImageUrl;
    private Long ownerId;
    private String ownerName;
    private Long jockeyId;
    private String jockeyName;
    private Long pairingContractId;
    private Integer laneNumber;
    private String status;
    private Boolean ownerConfirmed;
    private Boolean jockeyConfirmed;
    private Boolean refereeApproved;
    private String healthCheckStatus;
    private String refereeNotes;
    private String withdrawReason;
    private String dnfReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RaceEntryResponse from(RaceRegistration registration,
                                         String horseName,
                                         String horseImageUrl,
                                         String ownerName,
                                         String jockeyName) {
        return RaceEntryResponse.builder()
                .id(registration.getId())
                .raceId(registration.getRaceId())
                .horseId(registration.getHorseId())
                .horseName(horseName)
                .horseImageUrl(horseImageUrl)
                .ownerId(registration.getOwnerId())
                .ownerName(ownerName)
                .jockeyId(registration.getJockeyId())
                .jockeyName(jockeyName)
                .pairingContractId(registration.getPairingContractId())
                .laneNumber(registration.getLaneNumber())
                .status(registration.getStatus())
                .ownerConfirmed(registration.getOwnerConfirmed())
                .jockeyConfirmed(registration.getJockeyConfirmed())
                .refereeApproved(registration.getRefereeApproved())
                .healthCheckStatus(registration.getHealthCheckStatus())
                .refereeNotes(registration.getRefereeNotes())
                .withdrawReason(registration.getWithdrawReason())
                .dnfReason(registration.getDnfReason())
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }
}

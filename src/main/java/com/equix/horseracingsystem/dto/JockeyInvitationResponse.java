package com.equix.horseracingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JockeyInvitationResponse {
    private Long id;
    private Long raceId;
    private String raceName;
    private Long horseId;
    private String horseName;
    private Long ownerId;
    private String ownerName;
    private Long jockeyId;
    private String jockeyName;
    private String status;
    private String message;
    private String responseNote;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}

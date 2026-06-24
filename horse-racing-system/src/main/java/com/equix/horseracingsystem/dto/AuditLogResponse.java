package com.equix.horseracingsystem.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userRole;
    private String action;
    private String entityType;
    private Long entityId;
    private String beforeValue;
    private String afterValue;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
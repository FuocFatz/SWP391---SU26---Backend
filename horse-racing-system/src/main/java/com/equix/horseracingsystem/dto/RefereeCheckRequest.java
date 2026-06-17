package com.equix.horseracingsystem.dto;

import lombok.Data;

@Data
public class RefereeCheckRequest {
    private Boolean approved;
    private String healthCheckStatus;
    private String notes;
}

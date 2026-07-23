package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReassignRefereeRequest {
    @NotNull
    private Long refereeId;

    @NotBlank
    @Size(min = 20, max = 1000)
    private String reason;
}

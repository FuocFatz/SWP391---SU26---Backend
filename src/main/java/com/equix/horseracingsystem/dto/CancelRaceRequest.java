package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelRaceRequest {
    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 1000, message = "Cancellation reason must be at most 1000 characters")
    private String reason;
}

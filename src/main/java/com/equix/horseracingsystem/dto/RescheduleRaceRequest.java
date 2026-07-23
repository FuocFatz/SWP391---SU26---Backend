package com.equix.horseracingsystem.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RescheduleRaceRequest {
    @NotNull(message = "New race date and time are required")
    @Future(message = "New race date and time must be in the future")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Reschedule reason is required")
    @Size(max = 1000, message = "Reschedule reason must be at most 1000 characters")
    private String reason;
}
